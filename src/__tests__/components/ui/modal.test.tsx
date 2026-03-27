import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from '@/components/ui/modal';

describe('Modal accessibility', () => {
  it('dialog has aria-labelledby pointing to title', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Edit Profile">Content</Modal>);
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent('Edit Profile');
  });

  it('does not have aria-labelledby when no title', () => {
    render(<Modal isOpen onClose={vi.fn()}>Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('backdrop has aria-hidden', () => {
    const { container } = render(<Modal isOpen onClose={vi.fn()} title="Test">Content</Modal>);
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
  });
});
