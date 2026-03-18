import { describe, it, expect } from 'vitest';

function tempColor(temp: number): string {
  if (temp >= 35) return '#FF453A';
  if (temp >= 25) return '#FF9F0A';
  if (temp >= 10) return '#F5F5F7';
  return '#0A84FF';
}

describe('tempColor', () => {
  it('returns red for 35+', () => expect(tempColor(35)).toBe('#FF453A'));
  it('returns orange for 25-34', () => expect(tempColor(25)).toBe('#FF9F0A'));
  it('returns light for 10-24', () => expect(tempColor(10)).toBe('#F5F5F7'));
  it('returns blue for <10', () => expect(tempColor(9)).toBe('#0A84FF'));
  it('handles 0', () => expect(tempColor(0)).toBe('#0A84FF'));
  it('handles negative', () => expect(tempColor(-5)).toBe('#0A84FF'));
});
