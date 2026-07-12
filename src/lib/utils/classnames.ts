type ClassDictionary = Record<string, boolean | null | undefined>;

export function classNames(...values: unknown[]): string {
	const classes: string[] = [];

	const visit = (value: unknown): void => {
		if (!value) {
			return;
		}

		if (Array.isArray(value)) {
			value.forEach(visit);
			return;
		}

		if (typeof value === 'object') {
			Object.entries(value as ClassDictionary).forEach(([key, enabled]) => {
				if (enabled) {
					classes.push(key);
				}
			});
			return;
		}

		classes.push(String(value));
	};

	values.forEach(visit);

	return classes.join(' ');
}
