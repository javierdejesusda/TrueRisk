import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input accessibility', () => {
  it('sets aria-invalid and aria-describedby when error is present', () => {
    render(<Input label="Email" error="Required field" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    const errorId = input.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Required field');
  });

  it('renders error with role="alert"', () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('omits aria-invalid when no error', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('generates stable id without label prop', () => {
    render(<Input error="Bad value" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-describedby');
  });
});
