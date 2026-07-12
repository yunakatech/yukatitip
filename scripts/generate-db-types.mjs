import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_DB_URL = 'postgresql://postgres@127.0.0.1:54322/postgres';
const TABLE_ALIAS_MARKER_START = '// >>> GENERATED INSERT/UPDATE TYPES >>>';
const TABLE_ALIAS_MARKER_END = '// <<< GENERATED INSERT/UPDATE TYPES <<<';
const PSQL_PATHS = [
	process.env.PSQL_PATH,
	process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe' : undefined,
	process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' : undefined,
	process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe' : undefined,
	'psql'
].filter(Boolean);

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? DEFAULT_DB_URL;
const databaseFile = new URL('../src/lib/supabase/database.ts', import.meta.url);
const source = readFileSync(databaseFile, 'utf8');

function findPsqlPath() {
	for (const candidate of PSQL_PATHS) {
		if (candidate === 'psql') {
			return candidate;
		}

		if (existsSync(candidate)) {
			return candidate;
		}
	}

	throw new Error(
		'psql tidak ditemukan. Install PostgreSQL client atau set PSQL_PATH untuk menjalankan npm run db:types.'
	);
}

function runQuery(sql) {
	const result = spawnSync(findPsqlPath(), ['-X', '-A', '-t', '-F', '\u001f', '-d', dbUrl, '-c', sql], {
		encoding: 'utf8',
		maxBuffer: 20 * 1024 * 1024
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error((result.stderr || result.stdout || 'Gagal menjalankan psql.').trim());
	}

	return result.stdout.trim();
}

function splitRows(output) {
	if (!output) {
		return [];
	}

	return output
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.split('\u001f'));
}

function formatKeyUnion(keys) {
	if (keys.length === 0) {
		return 'never';
	}

	return keys.map((key) => `'${key}'`).join(' | ');
}

function unique(values) {
	return [...new Set(values)];
}

const tableToRowAlias = new Map();
const tableMappingRegex = /^\s*(\w+): Table<(\w+)(?:,\s*[^>]+)?>;/gm;
for (const match of source.matchAll(tableMappingRegex)) {
	tableToRowAlias.set(match[1], match[2]);
}

if (tableToRowAlias.size === 0) {
	throw new Error('Gagal membaca mapping tabel dari src/lib/supabase/database.ts.');
}

const columns = new Map();
for (const [tableName, columnName, isNullable, columnDefault, isIdentity, isGenerated] of splitRows(
	runQuery(`
		select
			table_name,
			column_name,
			is_nullable,
			nullif(column_default, ''),
			is_identity,
			is_generated
		from information_schema.columns
		where table_schema = 'public'
		order by table_name, ordinal_position
	`)
)) {
	if (!columns.has(tableName)) {
		columns.set(tableName, []);
	}

	columns.get(tableName).push({
		columnName,
		isNullable: isNullable === 'YES',
		columnDefault: columnDefault || null,
		isIdentity: isIdentity === 'YES',
		isGenerated: isGenerated !== 'NEVER'
	});
}

const primaryKeys = new Map();
for (const [tableName, columnName] of splitRows(
	runQuery(`
		select
			tc.table_name,
			kcu.column_name
		from information_schema.table_constraints tc
		join information_schema.key_column_usage kcu
			on tc.constraint_name = kcu.constraint_name
			and tc.table_schema = kcu.table_schema
		where tc.table_schema = 'public'
			and tc.constraint_type = 'PRIMARY KEY'
		order by tc.table_name, kcu.ordinal_position
	`)
)) {
	if (!primaryKeys.has(tableName)) {
		primaryKeys.set(tableName, []);
	}

	primaryKeys.get(tableName).push(columnName);
}

function buildInsertType(rowAlias, tableName) {
	const tableColumns = columns.get(tableName) || [];
	const required = tableColumns
		.filter(
			(column) =>
				!column.isGenerated &&
				!column.isIdentity &&
				!column.isNullable &&
				column.columnDefault === null
		)
		.map((column) => column.columnName);
	const optional = tableColumns
		.filter(
			(column) =>
				!column.isGenerated &&
				!column.isIdentity &&
				!required.includes(column.columnName)
		)
		.map((column) => column.columnName);

	if (required.length === 0 && optional.length === 0) {
		return 'Record<string, never>';
	}

	const requiredPick = required.length > 0 ? `Pick<${rowAlias}, ${formatKeyUnion(required)}>` : null;
	const optionalPick = optional.length > 0 ? `Partial<Pick<${rowAlias}, ${formatKeyUnion(optional)}>>` : null;

	if (requiredPick && optionalPick) {
		return `${requiredPick} & ${optionalPick}`;
	}

	return requiredPick || optionalPick || 'Record<string, never>';
}

function buildUpdateType(rowAlias, tableName) {
	const tableColumns = columns.get(tableName) || [];
	const omitted = unique([
		...(primaryKeys.get(tableName) || []),
		...tableColumns.filter((column) => column.isGenerated || column.isIdentity).map((column) => column.columnName)
	]);

	if (omitted.length === 0) {
		return `Partial<${rowAlias}>`;
	}

	return `Partial<Omit<${rowAlias}, ${formatKeyUnion(omitted)}>>`;
}

const generatedTypeAliases = [];
for (const [tableName, rowAlias] of [...tableToRowAlias.entries()]) {
	const baseName = rowAlias.replace(/Row$/, '');
	const insertTypeName = `${baseName}Insert`;
	const updateTypeName = `${baseName}Update`;

	generatedTypeAliases.push(`type ${insertTypeName} = ${buildInsertType(rowAlias, tableName)};`);
	generatedTypeAliases.push(`type ${updateTypeName} = ${buildUpdateType(rowAlias, tableName)};`);
}

function replaceIfPresent(sourceText, searchValue, replaceValue) {
	if (!sourceText.includes(searchValue)) {
		return sourceText;
	}

	return sourceText.replace(searchValue, replaceValue);
}

let output = source.replace(
	new RegExp(`\\n${TABLE_ALIAS_MARKER_START}[\\s\\S]*?${TABLE_ALIAS_MARKER_END}\\n`, 'm'),
	'\n'
);

output = replaceIfPresent(
	output,
	`type Table<Row extends Record<string, unknown>> = {\n\tRow: Row;\n\tInsert: Partial<Row>;\n\tUpdate: Partial<Row>;\n\tRelationships: [];\n};`,
	`type Table<Row extends Record<string, unknown>, Insert extends Record<string, unknown>, Update extends Record<string, unknown>> = {\n\tRow: Row;\n\tInsert: Insert;\n\tUpdate: Update;\n\tRelationships: [];\n};`
);

output = replaceIfPresent(
	output,
	`export type ServiceType = 'purchase' | 'pickup' | 'delivery';\nexport type FulfillmentMethod = 'branch_pickup' | 'local_delivery';`,
	`export type ServiceType = 'purchase' | 'pickup' | 'delivery';\nexport type StaffTaskRevenueType = 'purchase_service' | 'pickup_service' | 'delivery_service' | 'local_delivery_service' | 'handling_service' | 'other_service';\nexport type FulfillmentMethod = 'branch_pickup' | 'local_delivery';`
);

output = replaceIfPresent(output, `revenue_type: string;`, `revenue_type: StaffTaskRevenueType;`);

if (!output.includes('\t\t\tstaff_task_revenue_type: StaffTaskRevenueType;')) {
	output = replaceIfPresent(
		output,
		`attachment_entity_type: AttachmentEntityType;\n\t\t\trevenue_status: RevenueStatus;`,
		`attachment_entity_type: AttachmentEntityType;\n\t\t\trevenue_status: RevenueStatus;\n\t\t\tstaff_task_revenue_type: StaffTaskRevenueType;`
	);
}

output = output.replace(
	/\nexport type Database = \{/,
	`\n${TABLE_ALIAS_MARKER_START}\n${generatedTypeAliases.join('\n')}\n${TABLE_ALIAS_MARKER_END}\n\nexport type Database = {`
);

output = output.replace(
	/^\s*(\w+): Table<(\w+)(?:,\s*[^>]+)?>;/gm,
	(_match, tableName, rowAlias) =>
		`\t\t\t${tableName}: Table<${rowAlias}, ${rowAlias.replace(/Row$/, '')}Insert, ${rowAlias.replace(/Row$/, '')}Update>;`
);

output = output.replace(
	new RegExp(`\\n${TABLE_ALIAS_MARKER_START}[\\s\\S]*?${TABLE_ALIAS_MARKER_END}\\n`, 'm'),
	`\n${TABLE_ALIAS_MARKER_START}\n${generatedTypeAliases.join('\n')}\n${TABLE_ALIAS_MARKER_END}\n`
);

writeFileSync(databaseFile, `${output.replace(/\r\n/g, '\n').replace(/\n?$/, '\n')}`, 'utf8');
