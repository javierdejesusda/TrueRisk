import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Select } from '@/components/ui/select';

afterEach(() => {
  cleanup();
});

const opts = [{ value: 'a', label: 'Option A' }];

describe('Select accessibility', () => {
  it('sets aria-invalid and aria-describedby when error is present', () => {
    render(<Select label="Province" options={opts} error="Pick one" />);
    const select = screen.getByLabelText('Province');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    const errorId = select.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Pick one');
  });

  it('renders error with role="alert"', () => {
    render(<Select label="Province" options={opts} error="Pick one" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one');
  });

  it('omits aria-invalid when no error', () => {
    render(<Select label="Province" options={opts} />);
    expect(screen.getByLabelText('Province')).not.toHaveAttribute('aria-invalid');
  });
});
