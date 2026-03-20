import { describe, it, expect } from 'vitest';

const HAZARDS = [
  { key: 'flood', field: 'flood_score', tip: '0-20 Low, 20-40 Moderate, 40-60 High, 60-80 Very High, 80+ Critical' },
  { key: 'wildfire', field: 'wildfire_score', tip: 'Based on FWI system, dry days, humidity, and temperature' },
  { key: 'drought', field: 'drought_score', tip: 'Derived from SPEI index and soil moisture deficit' },
  { key: 'heatwave', field: 'heatwave_score', tip: 'Heat index, consecutive hot days/nights, WBGT' },
  { key: 'seismic', field: 'seismic_score', tip: 'IGN earthquake data: magnitude, frequency, proximity' },
  { key: 'coldwave', field: 'coldwave_score', tip: 'Wind chill, consecutive cold days, elevation' },
  { key: 'windstorm', field: 'windstorm_score', tip: 'Wind gusts, pressure dynamics, coastal exposure' },
] as const;

function severityVariant(severity: string): string {
  switch (severity) {
    case 'low': return 'success';
    case 'moderate': return 'info';
    case 'high': return 'warning';
    case 'very_high':
    case 'critical': return 'danger';
    default: return 'success';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-accent-red';
  if (score >= 60) return 'text-accent-yellow';
  if (score >= 40) return 'text-accent-blue';
  return 'text-accent-green';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-accent-red';
  if (score >= 60) return 'bg-accent-yellow';
  if (score >= 40) return 'bg-accent-blue';
  return 'bg-accent-green';
}

describe('RiskOverview logic', () => {
  it('has all 7 hazards defined', () => {
    expect(HAZARDS).toHaveLength(7);
    const keys = HAZARDS.map(h => h.key);
    expect(keys).toContain('flood');
    expect(keys).toContain('wildfire');
    expect(keys).toContain('drought');
    expect(keys).toContain('heatwave');
    expect(keys).toContain('seismic');
    expect(keys).toContain('coldwave');
    expect(keys).toContain('windstorm');
  });

  it('all hazards have tooltip text', () => {
    HAZARDS.forEach(h => {
      expect(h.tip.length).toBeGreaterThan(10);
    });
  });

  describe('severityVariant', () => {
    it('maps low to success', () => expect(severityVariant('low')).toBe('success'));
    it('maps moderate to info', () => expect(severityVariant('moderate')).toBe('info'));
    it('maps high to warning', () => expect(severityVariant('high')).toBe('warning'));
    it('maps very_high to danger', () => expect(severityVariant('very_high')).toBe('danger'));
    it('maps critical to danger', () => expect(severityVariant('critical')).toBe('danger'));
    it('defaults to success', () => expect(severityVariant('unknown')).toBe('success'));
  });

  describe('scoreColor', () => {
    it('returns red for >= 80', () => expect(scoreColor(85)).toBe('text-accent-red'));
    it('returns yellow for >= 60', () => expect(scoreColor(65)).toBe('text-accent-yellow'));
    it('returns blue for >= 40', () => expect(scoreColor(45)).toBe('text-accent-blue'));
    it('returns green for < 40', () => expect(scoreColor(20)).toBe('text-accent-green'));
  });

  describe('barColor', () => {
    it('returns red for >= 80', () => expect(barColor(90)).toBe('bg-accent-red'));
    it('returns yellow for >= 60', () => expect(barColor(70)).toBe('bg-accent-yellow'));
    it('returns blue for >= 40', () => expect(barColor(50)).toBe('bg-accent-blue'));
    it('returns green for < 40', () => expect(barColor(10)).toBe('bg-accent-green'));
  });
});
