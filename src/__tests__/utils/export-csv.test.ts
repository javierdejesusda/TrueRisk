import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportCsv } from '@/lib/export-csv';

describe('exportCsv', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let mockLink: { href: string; download: string; style: { display: string }; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLink = { href: '', download: '', style: { display: '' }, click: vi.fn() };
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    createObjectURLSpy = vi.fn().mockReturnValue('blob:test-url');
    revokeObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURLSpy as typeof URL.revokeObjectURL;
  });

  it('does nothing for empty data', () => {
    exportCsv([]);
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it('creates CSV with headers and rows', () => {
    exportCsv([
      { name: 'flood', score: 42 },
      { name: 'wildfire', score: 18 },
    ], 'test.csv');

    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toBe('test.csv');
  });

  it('escapes values with commas', () => {
    exportCsv([{ desc: 'hello, world', value: 10 }]);
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('escapes values with quotes', () => {
    exportCsv([{ desc: 'say "hello"', value: 10 }]);
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('handles null and undefined values', () => {
    exportCsv([{ a: null, b: undefined, c: 'ok' } as Record<string, unknown>]);
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('uses default filename', () => {
    exportCsv([{ x: 1 }]);
    expect(mockLink.download).toBe('export.csv');
  });
});
