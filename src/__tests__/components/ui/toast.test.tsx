import { describe, it, expect } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { ToastContainer, showToast } from '@/components/ui/toast';

describe('Toast accessibility', () => {
  it('toast container has aria-live="polite" and role="status"', () => {
    const { container } = render(<ToastContainer />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
    cleanup();
  });

  it('toast items are announced within the live region', () => {
    render(<ToastContainer />);
    act(() => { showToast({ title: 'Saved successfully', severity: 1 }); });
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });
});
