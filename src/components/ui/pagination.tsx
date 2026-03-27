'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Go to previous page"
        className="cursor-pointer rounded-md px-2 py-1 text-xs font-[family-name:var(--font-sans)] text-text-muted transition-colors hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-text-muted" aria-hidden="true">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Go to page ${p}`}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] transition-colors ${
              p === page
                ? 'bg-accent-green/15 text-accent-green font-bold'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Go to next page"
        className="cursor-pointer rounded-md px-2 py-1 text-xs font-[family-name:var(--font-sans)] text-text-muted transition-colors hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}
