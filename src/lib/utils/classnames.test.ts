import { describe, expect, it } from 'vitest';

import { classNames } from './classnames';

describe('classNames', () => {
	it('joins strings, arrays, and records', () => {
		expect(classNames('a', ['b', false, ['c']], { d: true, e: false })).toBe('a b c d');
	});
});
