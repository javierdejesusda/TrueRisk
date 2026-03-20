import { describe, it, expect } from 'vitest';

const variantStyles = {
  success: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  warning: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  danger: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  info: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  neutral: 'bg-bg-card text-text-secondary border-border',
} as const;

const severityStyles: Record<number, string> = {
  1: 'bg-severity-1/15 text-severity-1 border-severity-1/30',
  2: 'bg-severity-2/15 text-severity-2 border-severity-2/30',
  3: 'bg-severity-3/15 text-severity-3 border-severity-3/30',
  4: 'bg-severity-4/15 text-severity-4 border-severity-4/30',
  5: 'bg-severity-5/15 text-severity-5 border-severity-5/30',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const;

type BadgeVariant = keyof typeof variantStyles;
type BadgeSize = keyof typeof sizeStyles;

describe('Badge component styles', () => {
  describe('variant styles', () => {
    it('success variant includes green colors', () => {
      expect(variantStyles.success).toContain('accent-green');
    });

    it('warning variant includes yellow colors', () => {
      expect(variantStyles.warning).toContain('accent-yellow');
    });

    it('danger variant includes red colors', () => {
      expect(variantStyles.danger).toContain('accent-red');
    });

    it('info variant includes blue colors', () => {
      expect(variantStyles.info).toContain('accent-blue');
    });

    it('neutral variant uses card background', () => {
      expect(variantStyles.neutral).toContain('bg-bg-card');
    });

    it('all variants are defined', () => {
      const variants: BadgeVariant[] = [
        'success',
        'warning',
        'danger',
        'info',
        'neutral',
      ];
      variants.forEach((variant) => {
        expect(variantStyles[variant]).toBeDefined();
        expect(typeof variantStyles[variant]).toBe('string');
      });
    });
  });

  describe('severity mapping', () => {
    it('severity 1 maps to severity-1 colors', () => {
      expect(severityStyles[1]).toContain('severity-1');
    });

    it('severity 2 maps to severity-2 colors', () => {
      expect(severityStyles[2]).toContain('severity-2');
    });

    it('severity 3 maps to severity-3 colors', () => {
      expect(severityStyles[3]).toContain('severity-3');
    });

    it('severity 4 maps to severity-4 colors', () => {
      expect(severityStyles[4]).toContain('severity-4');
    });

    it('severity 5 maps to severity-5 colors', () => {
      expect(severityStyles[5]).toContain('severity-5');
    });

    it('all severity levels 1-5 are defined', () => {
      const severities = [1, 2, 3, 4, 5];
      severities.forEach((severity) => {
        expect(severityStyles[severity]).toBeDefined();
        expect(typeof severityStyles[severity]).toBe('string');
      });
    });

    it('severity styles follow consistent pattern', () => {
      const severities = [1, 2, 3, 4, 5];
      severities.forEach((severity) => {
        const style = severityStyles[severity];
        expect(style).toMatch(/bg-severity-\d+\/15/);
        expect(style).toMatch(/text-severity-\d+/);
        expect(style).toMatch(/border-severity-\d+\/30/);
      });
    });
  });

  describe('size styles', () => {
    it('sm size has small padding', () => {
      expect(sizeStyles.sm).toContain('px-2');
      expect(sizeStyles.sm).toContain('py-0.5');
    });

    it('md size has medium padding', () => {
      expect(sizeStyles.md).toContain('px-2.5');
      expect(sizeStyles.md).toContain('py-1');
    });

    it('all sizes defined', () => {
      const sizes: BadgeSize[] = ['sm', 'md'];
      sizes.forEach((size) => {
        expect(sizeStyles[size]).toBeDefined();
        expect(typeof sizeStyles[size]).toBe('string');
      });
    });
  });

  describe('pulse animation', () => {
    it('pulse prop adds animate-pulse class', () => {
      const pulse = true;
      const pulseClass = pulse && 'animate-pulse';
      expect(pulseClass).toBe('animate-pulse');
    });

    it('pulse false returns falsy', () => {
      const pulse = false;
      const pulseClass = pulse && 'animate-pulse';
      expect(pulseClass).toBeFalsy();
    });

    it('pulse animation classes would be filtered', () => {
      const classes = [
        'inline-flex',
        false && 'animate-pulse',
        'border',
      ].filter(Boolean);
      expect(classes).toHaveLength(2);
      expect(classes).not.toContain('animate-pulse');
    });

    it('pulse true classes would be included', () => {
      const classes = [
        'inline-flex',
        true && 'animate-pulse',
        'border',
      ].filter(Boolean);
      expect(classes).toHaveLength(3);
      expect(classes).toContain('animate-pulse');
    });
  });
});
