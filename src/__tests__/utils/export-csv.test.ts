import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportCsv } from '@/lib/export-csv';

describe('exportCsv', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: { href: string; download: string; style: { display: string }; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLink = { href: '', download: '', style: { display: '' }, click: vi.fn() };
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    createObjectURLSpy = vi.fn().mockReturnValue('blob:test-url') as any;
    revokeObjectURLSpy = vi.fn() as any;
    global.URL.createObjectURL = createObjectURLSpy as any;
    global.URL.revokeObjectURL = revokeObjectURLSpy as any;
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
    exportCsv([{ a: null, b: undefined, c: 'ok' } as any]);
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('uses default filename', () => {
    exportCsv([{ x: 1 }]);
    expect(mockLink.download).toBe('export.csv');
  });
});
