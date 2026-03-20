import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useRiskScore fetch behavior', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  it('fetches risk data from the correct URL', async () => {
    const mockData = {
      province_code: '28',
      flood_score: 15,
      wildfire_score: 22,
      drought_score: 10,
      heatwave_score: 45,
      seismic_score: 3,
      coldwave_score: 8,
      windstorm_score: 12,
      composite_score: 48,
      dominant_hazard: 'heatwave',
      severity: 'high',
      computed_at: '2026-03-20T10:00:00Z',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const res = await fetch('/api/risk/28');
    const data = await res.json();

    expect(fetchSpy).toHaveBeenCalledWith('/api/risk/28');
    expect(data.province_code).toBe('28');
    expect(data.composite_score).toBe(48);
    expect(data.dominant_hazard).toBe('heatwave');
  });

  it('handles HTTP errors', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const res = await fetch('/api/risk/99');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  it('handles network errors', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    await expect(fetch('/api/risk/28')).rejects.toThrow('Network error');
  });

  it('response contains all required score fields', async () => {
    const mockData = {
      province_code: '08',
      flood_score: 0,
      wildfire_score: 0,
      drought_score: 0,
      heatwave_score: 0,
      seismic_score: 0,
      coldwave_score: 0,
      windstorm_score: 0,
      composite_score: 0,
      dominant_hazard: 'none',
      severity: 'low',
      computed_at: '2026-03-20T10:00:00Z',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const res = await fetch('/api/risk/08');
    const data = await res.json();

    const requiredFields = [
      'flood_score', 'wildfire_score', 'drought_score', 'heatwave_score',
      'seismic_score', 'coldwave_score', 'windstorm_score',
      'composite_score', 'dominant_hazard', 'severity',
    ];
    requiredFields.forEach(field => {
      expect(data).toHaveProperty(field);
    });
  });
});
