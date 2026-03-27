import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from '@/components/ui/pagination';

describe('Pagination accessibility', () => {
  it('active page has aria-current="page"', () => {
    render(<Pagination page={3} totalPages={7} onPageChange={vi.fn()} />);
    const active = screen.getByText('3');
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('inactive pages do not have aria-current', () => {
    render(<Pagination page={3} totalPages={7} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('4')).not.toHaveAttribute('aria-current');
  });

  it('page buttons have aria-label', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Go to page 3')).toBeInTheDocument();
  });

  it('Prev/Next have aria-labels', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
  });

  it('ellipsis is hidden from screen readers', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);
    const ellipses = screen.getAllByText('...');
    ellipses.forEach((el) => expect(el).toHaveAttribute('aria-hidden', 'true'));
  });
});
