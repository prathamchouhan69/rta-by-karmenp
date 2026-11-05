import { describe, expect, it } from 'vitest';
import { asZohoMoney } from './index';

describe('money text', () => {
  it('keeps trailing zeroes as text', () => expect(asZohoMoney('100.50')).toBe('100.50'));
});
