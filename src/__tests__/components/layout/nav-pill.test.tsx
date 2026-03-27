import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/store/app-store', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ alerts: [], risk: null, clearAuth: vi.fn() }),
}));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { name: 'Alice', image: null }, signOut: vi.fn() }),
}));
vi.mock('@/components/layout/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="lang-switcher" />,
}));

import { NavPill } from '@/components/layout/nav-pill';

describe('NavPill accessibility', () => {
  it('user menu button has aria-label and aria-expanded', () => {
    render(<NavPill />);
    const btn = screen.getByLabelText('User menu');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-haspopup', 'true');
  });

  it('aria-expanded becomes true when dropdown opens', () => {
    render(<NavPill />);
    const btn = screen.getByLabelText('User menu');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('NavPill mobile overflow', () => {
  it('nav container does not use fixed max-w-3xl', () => {
    const { container } = render(<NavPill />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).not.toContain('max-w-3xl');
    expect(nav.className).toContain('max-w-[calc(100vw-2rem)]');
  });
});
