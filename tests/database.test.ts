import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type Row = Record<string, unknown> & { id: string };

const schemaSql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const initialMigrationSql = readFileSync(
	new URL('../supabase/migrations/20260712000000_initial_yukatitip_schema.sql', import.meta.url),
	'utf8'
);
const sampleData = JSON.parse(readFileSync(new URL('../sample-data.json', import.meta.url), 'utf8')) as Record<
	string,
	unknown
>;

function rows(name: string): Row[] {
	const value = sampleData[name];

	if (!Array.isArray(value)) {
		throw new Error(`sample-data.json missing collection: ${name}`);
	}

	return value as Row[];
}

function mapRows(name: string): Map<string, Row> {
	return new Map(rows(name).map((row) => [row.id, row]));
}

function stringField(row: Row, key: string): string {
	const value = row[key];

	if (typeof value !== 'string') {
		throw new Error(`Expected ${key} to be a string on row ${row.id}`);
	}

	return value;
}

function maybeStringField(row: Row, key: string): string | null {
	const value = row[key];

	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value !== 'string') {
		throw new Error(`Expected ${key} to be a string or null on row ${row.id}`);
	}

	return value;
}

function numberField(row: Row, key: string): number {
	const value = row[key];

	if (typeof value !== 'number') {
		throw new Error(`Expected ${key} to be a number on row ${row.id}`);
	}

	return value;
}

function assertRef(map: Map<string, Row>, id: string | null | undefined, label: string): void {
	if (id === null || id === undefined) {
		return;
	}

	expect(map.has(id)).toBe(true);

	if (!map.has(id)) {
		throw new Error(`Missing ${label}: ${id}`);
	}
}

function assertUnique(values: string[], label: string): void {
	expect(new Set(values).size).toBe(values.length);

	if (new Set(values).size !== values.length) {
		throw new Error(`Duplicate values in ${label}`);
	}
}

describe('database schema contract', () => {
	it('keeps the initial migration self-contained', () => {
		expect(initialMigrationSql).not.toMatch(/\\ir\s+\.\.\/\.\.\/schema\.sql/i);
		expect(initialMigrationSql).toMatch(/create table if not exists public\.branches/i);
		expect(initialMigrationSql).toMatch(/create table if not exists public\.staff_task_revenues/i);
	});

	it('exposes authenticated browser grants for reference tables', () => {
		expect(schemaSql).not.toMatch(/grant usage on schema public to anon, authenticated;/i);
		expect(schemaSql).toMatch(/grant usage on schema public to authenticated;/i);
		expect(schemaSql).toMatch(/grant select on table[\s\S]*public\.roles/i);
		expect(schemaSql).toMatch(/public\.expense_categories/i);
	});

	it('keeps core sample data referentially intact', () => {
		const roles = mapRows('roles');
		const permissions = mapRows('permissions');
		const branches = mapRows('branches');
		const profiles = mapRows('profiles');
		const positions = mapRows('positions');
		const employees = mapRows('employees');
		const routes = mapRows('routes');
		const customers = mapRows('customers');
		const stores = mapRows('stores');
		const orders = mapRows('orders');
		const orderItems = mapRows('order_items');
		const payments = mapRows('payments');
		const trips = mapRows('trips');
		const tripHandovers = mapRows('trip_handovers');
		const staffTasks = mapRows('staff_tasks');
		const expenseCategories = mapRows('expense_categories');
		const commissionPeriods = mapRows('commission_periods');
		const advances = mapRows('daily_operational_advances');
		const expenses = mapRows('daily_operational_expenses');
		const commissions = mapRows('employee_commissions');
		const payrollPeriods = mapRows('payroll_periods');
		const branchExpenses = mapRows('branch_expenses');
		const rentContracts = mapRows('branch_rent_contracts');
		const authUsers = mapRows('auth_users');
		const branchManagerPositionId = stringField(
			positions.get('12000000-0000-4000-8000-000000000002') as Row,
			'id'
		);
		const allowedRevenueTypes = new Set([
			'purchase_service',
			'pickup_service',
			'delivery_service',
			'local_delivery_service',
			'handling_service',
			'other_service'
		]);

		assertUnique(rows('roles').map((row) => stringField(row, 'code')), 'role codes');
		assertUnique(rows('permissions').map((row) => stringField(row, 'code')), 'permission codes');
		assertUnique(rows('branches').map((row) => stringField(row, 'code')), 'branch codes');
		assertUnique(rows('employees').map((row) => stringField(row, 'employee_number')), 'employee numbers');
		assertUnique(rows('orders').map((row) => stringField(row, 'tracking_number')), 'tracking numbers');
		assertUnique(rows('trips').map((row) => stringField(row, 'trip_number')), 'trip numbers');
		assertUnique(rows('staff_tasks').map((row) => stringField(row, 'task_number')), 'task numbers');
		assertUnique(rows('customers').map((row) => stringField(row, 'phone')), 'customer phone numbers');

		rows('role_permissions').forEach((row) => {
			assertRef(roles, stringField(row, 'role_id'), 'role');
			assertRef(permissions, stringField(row, 'permission_id'), 'permission');
		});

		rows('profiles').forEach((row) => {
			assertRef(authUsers, row.id, 'auth user');
			assertRef(roles, stringField(row, 'role_id'), 'role');
			assertRef(branches, maybeStringField(row, 'branch_id'), 'branch');
		});

		rows('branches').forEach((row) => {
			const headEmployeeId = maybeStringField(row, 'head_employee_id');

			if (headEmployeeId) {
				assertRef(employees, headEmployeeId, 'head employee');
				const headEmployee = employees.get(headEmployeeId) as Row;

				expect(stringField(headEmployee, 'branch_id')).toBe(row.id);
				expect(stringField(headEmployee, 'employment_status')).toBe('active');
				expect(stringField(headEmployee, 'position_id')).toBe(branchManagerPositionId);
			}
		});

		rows('employees').forEach((row) => {
			assertRef(profiles, maybeStringField(row, 'profile_id'), 'employee profile');
			assertRef(branches, stringField(row, 'branch_id'), 'employee branch');
			assertRef(positions, stringField(row, 'position_id'), 'employee position');
			assertRef(employees, maybeStringField(row, 'supervisor_employee_id'), 'supervisor employee');
		});

		rows('routes').forEach((row) => {
			const originBranchId = stringField(row, 'origin_branch_id');
			const destinationBranchId = stringField(row, 'destination_branch_id');

			assertRef(branches, originBranchId, 'route origin branch');
			assertRef(branches, destinationBranchId, 'route destination branch');
			expect(originBranchId).not.toBe(destinationBranchId);
		});

		rows('route_schedules').forEach((row) => {
			assertRef(routes, stringField(row, 'route_id'), 'route schedule route');
		});

		rows('route_tariffs').forEach((row) => {
			assertRef(routes, stringField(row, 'route_id'), 'route tariff route');
		});

		rows('customers').forEach((row) => {
			assertRef(branches, maybeStringField(row, 'home_branch_id'), 'customer home branch');
			assertRef(profiles, maybeStringField(row, 'created_by'), 'customer creator');
		});

		rows('stores').forEach((row) => {
			assertRef(branches, maybeStringField(row, 'branch_id'), 'store branch');
		});

		rows('orders').forEach((row) => {
			const originBranchId = stringField(row, 'origin_branch_id');
			const destinationBranchId = stringField(row, 'destination_branch_id');
			const routeId = stringField(row, 'route_id');

			assertRef(branches, originBranchId, 'order origin branch');
			assertRef(branches, destinationBranchId, 'order destination branch');
			assertRef(routes, routeId, 'order route');
			assertRef(customers, stringField(row, 'sender_customer_id'), 'order sender customer');
			assertRef(customers, maybeStringField(row, 'receiver_customer_id'), 'order receiver customer');
			assertRef(profiles, stringField(row, 'created_by'), 'order creator');
			assertRef(profiles, maybeStringField(row, 'updated_by'), 'order updater');

			const route = routes.get(routeId) as Row;
			expect(stringField(route, 'origin_branch_id')).toBe(originBranchId);
			expect(stringField(route, 'destination_branch_id')).toBe(destinationBranchId);
		});

		rows('order_items').forEach((row) => {
			assertRef(orders, stringField(row, 'order_id'), 'order item order');
			assertRef(stores, maybeStringField(row, 'store_id'), 'order item store');
		});

		rows('tracking_events').forEach((row) => {
			assertRef(orders, stringField(row, 'order_id'), 'tracking event order');
			assertRef(profiles, maybeStringField(row, 'created_by'), 'tracking event creator');
		});

		rows('payments').forEach((row) => {
			assertRef(orders, stringField(row, 'order_id'), 'payment order');
			assertRef(profiles, maybeStringField(row, 'verified_by'), 'payment verifier');
		});

		rows('trips').forEach((row) => {
			const routeId = stringField(row, 'route_id');
			const originBranchId = stringField(row, 'origin_branch_id');
			const destinationBranchId = stringField(row, 'destination_branch_id');

			assertRef(routes, routeId, 'trip route');
			assertRef(branches, originBranchId, 'trip origin branch');
			assertRef(branches, destinationBranchId, 'trip destination branch');
			assertRef(employees, maybeStringField(row, 'origin_staff_id'), 'trip origin staff');
			assertRef(employees, maybeStringField(row, 'destination_staff_id'), 'trip destination staff');
			assertRef(profiles, stringField(row, 'created_by'), 'trip creator');

			const route = routes.get(routeId) as Row;
			expect(stringField(route, 'origin_branch_id')).toBe(originBranchId);
			expect(stringField(route, 'destination_branch_id')).toBe(destinationBranchId);
		});

		rows('trip_handovers').forEach((row) => {
			assertRef(trips, stringField(row, 'trip_id'), 'trip handover trip');
			assertRef(employees, stringField(row, 'employee_id'), 'trip handover employee');
		});

		rows('staff_tasks').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'staff task branch');
			assertRef(trips, maybeStringField(row, 'trip_id'), 'staff task trip');
			assertRef(employees, stringField(row, 'assigned_to'), 'staff task assignee');
			assertRef(profiles, stringField(row, 'created_by'), 'staff task creator');
		});

		rows('task_items').forEach((row) => {
			assertRef(staffTasks, stringField(row, 'task_id'), 'task item task');
			assertRef(orderItems, stringField(row, 'order_item_id'), 'task item order item');
		});

		rows('commission_periods').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'commission period branch');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'commission approval profile');
		});

		rows('daily_operational_advances').forEach((row) => {
			assertRef(employees, stringField(row, 'employee_id'), 'advance employee');
			assertRef(branches, stringField(row, 'branch_id'), 'advance branch');
			assertRef(staffTasks, maybeStringField(row, 'task_id'), 'advance task');
			assertRef(trips, maybeStringField(row, 'trip_id'), 'advance trip');
			assertRef(profiles, maybeStringField(row, 'submitted_by'), 'advance submitter');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'advance approver');
			assertRef(profiles, maybeStringField(row, 'disbursed_by'), 'advance disburser');
		});

		rows('daily_operational_expenses').forEach((row) => {
			assertRef(advances, maybeStringField(row, 'advance_id'), 'expense advance');
			assertRef(employees, stringField(row, 'employee_id'), 'expense employee');
			assertRef(branches, stringField(row, 'branch_id'), 'expense branch');
			assertRef(staffTasks, maybeStringField(row, 'task_id'), 'expense task');
			assertRef(trips, maybeStringField(row, 'trip_id'), 'expense trip');
			assertRef(expenseCategories, stringField(row, 'category_id'), 'expense category');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'expense approver');
			assertRef(commissionPeriods, maybeStringField(row, 'commission_period_id'), 'expense commission period');
		});

		rows('staff_task_revenues').forEach((row) => {
			assertRef(employees, stringField(row, 'employee_id'), 'revenue employee');
			assertRef(staffTasks, stringField(row, 'task_id'), 'revenue task');
			assertRef(orders, stringField(row, 'order_id'), 'revenue order');
			assertRef(commissionPeriods, maybeStringField(row, 'commission_period_id'), 'revenue commission period');
			expect(allowedRevenueTypes.has(stringField(row, 'revenue_type'))).toBe(true);
		});

		rows('employee_commissions').forEach((row) => {
			assertRef(commissionPeriods, stringField(row, 'commission_period_id'), 'commission period');
			assertRef(employees, stringField(row, 'employee_id'), 'commission employee');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'commission approver');
			expect(Math.max(0, numberField(row, 'total_revenue') - numberField(row, 'total_operational_expense'))).toBe(0);
		});

		rows('payroll_periods').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'payroll branch');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'payroll approver');
		});

		rows('payroll_items').forEach((row) => {
			assertRef(payrollPeriods, stringField(row, 'payroll_period_id'), 'payroll item period');
			assertRef(employees, stringField(row, 'employee_id'), 'payroll item employee');
			assertRef(
				commissions,
				maybeStringField(row, 'reference_id') && stringField(row, 'item_type') === 'commission'
					? maybeStringField(row, 'reference_id')
					: null,
				'payroll commission reference'
			);
			assertRef(
				mapRows('employee_compensations'),
				maybeStringField(row, 'reference_id') && stringField(row, 'item_type') !== 'commission'
					? maybeStringField(row, 'reference_id')
					: null,
				'payroll compensation reference'
			);
		});

		rows('branch_expenses').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'branch expense branch');
			assertRef(expenseCategories, stringField(row, 'category_id'), 'branch expense category');
			assertRef(profiles, stringField(row, 'created_by'), 'branch expense creator');
			assertRef(profiles, maybeStringField(row, 'approved_by'), 'branch expense approver');
		});

		rows('branch_budgets').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'branch budget branch');
			assertRef(expenseCategories, stringField(row, 'category_id'), 'branch budget category');
			assertRef(profiles, stringField(row, 'created_by'), 'branch budget creator');
		});

		rows('branch_rent_contracts').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'rent contract branch');
			assertRef(profiles, stringField(row, 'created_by'), 'rent contract creator');
			expect(numberField(row, 'monthly_allocation')).toBe(numberField(row, 'total_amount') / 12);
		});

		rows('petty_cash_transactions').forEach((row) => {
			assertRef(branches, stringField(row, 'branch_id'), 'petty cash branch');
			assertRef(expenseCategories, maybeStringField(row, 'category_id'), 'petty cash category');
			assertRef(employees, maybeStringField(row, 'employee_id'), 'petty cash employee');
			assertRef(profiles, stringField(row, 'created_by'), 'petty cash creator');
		});

		assertUnique(
			rows('attachments').map((row) => stringField(row, 'object_key')),
			'attachment object keys'
		);

		rows('attachments').forEach((row) => {
			assertRef(profiles, maybeStringField(row, 'uploaded_by'), 'attachment uploader');
		});

		const attachmentTargets: Record<string, Map<string, Row>> = {
			order: orders,
			order_item: orderItems,
			payment: payments,
			trip: trips,
			trip_handover: tripHandovers,
			task: staffTasks,
			operational_advance: advances,
			operational_expense: expenses,
			branch_expense: branchExpenses,
			rent_contract: rentContracts,
			employee: employees
		};

		rows('attachments').forEach((row) => {
			const entityType = stringField(row, 'entity_type');
			const target = attachmentTargets[entityType];

			expect(target).toBeDefined();
			if (target) {
				assertRef(target, stringField(row, 'entity_id'), `attachment ${entityType}`);
			}
		});

		const auditTargets: Record<string, Map<string, Row>> = {
			payment: payments,
			daily_operational_expense: expenses,
			branch_expense: branchExpenses,
			trip_handover: tripHandovers,
			order: orders,
			task: staffTasks
		};

		rows('audit_logs').forEach((row) => {
			assertRef(profiles, maybeStringField(row, 'actor_profile_id'), 'audit actor');

			const entityType = stringField(row, 'entity_type');
			const target = auditTargets[entityType];

			expect(target).toBeDefined();
			if (target) {
				assertRef(target, maybeStringField(row, 'entity_id'), `audit ${entityType}`);
			}
		});
	});

	it('keeps the key money formulas aligned with the docs', () => {
		const firstOrder = rows('orders').find((row) => row.id === '80000000-0000-4000-8000-000000000001');

		expect(firstOrder).toBeDefined();
		if (firstOrder) {
			const expectedPayment =
				numberField(firstOrder, 'goods_amount') +
				numberField(firstOrder, 'service_revenue') +
				numberField(firstOrder, 'additional_service_fees') -
				numberField(firstOrder, 'discount_amount');

			expect(expectedPayment).toBe(410000);
		}

		expect(schemaSql).toMatch(/create type public\.staff_task_revenue_type as enum/i);
		expect(schemaSql).toMatch(/revenue_type public\.staff_task_revenue_type not null/i);
		expect(schemaSql).toMatch(
			/commission_amount bigint generated always as \(\s*round\(/i
		);
		expect(schemaSql).toMatch(
			/greatest\(0::numeric, \(total_revenue - total_operational_expense\)::numeric\)/i
		);

		const firstAdvance = rows('daily_operational_advances').find((row) => row.id === 'A1000000-0000-4000-8000-000000000001');
		const approvedExpenses = rows('daily_operational_expenses').filter(
			(row) => maybeStringField(row, 'advance_id') === 'A1000000-0000-4000-8000-000000000001' && stringField(row, 'approval_status') === 'approved'
		);

		expect(firstAdvance).toBeDefined();
		if (firstAdvance) {
			const totalApprovedExpense = approvedExpenses.reduce((sum, row) => sum + numberField(row, 'amount'), 0);
			expect(numberField(firstAdvance, 'amount') - totalApprovedExpense).toBe(25000);
		}

		expect(Math.round(Math.max(0, 12_345) * 12.5 / 100)).toBe(1543);
	});
});
