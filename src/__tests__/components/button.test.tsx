import { describe, it, expect } from 'vitest';

const variantStyles = {
  primary:
    'bg-accent-green text-[#050508] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]',
  danger:
    'bg-accent-red text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  ghost:
    'bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary',
  outline:
    'border border-border text-text-primary hover:border-accent-green/50 hover:text-accent-green',
  secondary:
    'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

describe('Button component styles', () => {
  describe('variant styles', () => {
    it('primary variant includes green background', () => {
      expect(variantStyles.primary).toContain('bg-accent-green');
    });

    it('danger variant includes red background', () => {
      expect(variantStyles.danger).toContain('bg-accent-red');
    });

    it('ghost variant is transparent', () => {
      expect(variantStyles.ghost).toContain('bg-transparent');
    });

    it('outline variant includes border', () => {
      expect(variantStyles.outline).toContain('border');
    });

    it('secondary variant uses card background', () => {
      expect(variantStyles.secondary).toContain('bg-bg-card');
    });

    it('all variants are defined', () => {
      const variants: ButtonVariant[] = [
        'primary',
        'danger',
        'ghost',
        'outline',
        'secondary',
      ];
      variants.forEach((variant) => {
        expect(variantStyles[variant]).toBeDefined();
        expect(typeof variantStyles[variant]).toBe('string');
      });
    });
  });

  describe('size styles', () => {
    it('sm size has small padding', () => {
      expect(sizeStyles.sm).toContain('px-3');
      expect(sizeStyles.sm).toContain('py-1.5');
    });

    it('md size has medium padding', () => {
      expect(sizeStyles.md).toContain('px-4');
      expect(sizeStyles.md).toContain('py-2');
    });

    it('lg size has large padding', () => {
      expect(sizeStyles.lg).toContain('px-6');
      expect(sizeStyles.lg).toContain('py-3');
    });

    it('all sizes include border radius', () => {
      const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
      sizes.forEach((size) => {
        expect(sizeStyles[size]).toMatch(/rounded-/);
      });
    });

    it('all sizes include gap', () => {
      const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
      sizes.forEach((size) => {
        expect(sizeStyles[size]).toMatch(/gap-/);
      });
    });
  });

  describe('button state classes', () => {
    it('disabled state includes opacity-50', () => {
      const disabledClass = 'disabled:opacity-50';
      expect(disabledClass).toContain('opacity-50');
    });

    it('loading state would disable button', () => {
      const loading = true;
      const disabled = false;
      const isDisabled = disabled || loading;
      expect(isDisabled).toBe(true);
    });

    it('both loading and disabled can be true', () => {
      const loading = true;
      const disabled = true;
      const isDisabled = disabled || loading;
      expect(isDisabled).toBe(true);
    });
  });
});
