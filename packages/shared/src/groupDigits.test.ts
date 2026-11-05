import { describe, expect, it } from 'vitest';
import { formatIndianGrouping } from './index';

describe('formatIndianGrouping', () => {
  it.each([
    ['0', '0'], ['0.5', '0.5'], ['100.50', '100.50'], ['1234.56', '1,234.56'],
    ['1234567.89', '12,34,567.89'], ['-1234567.89', '-12,34,567.89'],
    ['0001234', '1,234'], ['12345678901234567890.10', '1,23,45,67,89,01,23,45,67,890.10']
  ])('%s stays exact', (input, output) => expect(formatIndianGrouping(input)).toBe(output));
});
