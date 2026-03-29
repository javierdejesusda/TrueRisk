import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

let observerCallback: IntersectionObserverCallback;

beforeEach(() => {
  function MockIntersectionObserver(cb: IntersectionObserverCallback) {
    observerCallback = cb;
    return { observe: mockObserve, unobserve: mockUnobserve, disconnect: mockDisconnect };
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('LazySection', () => {
  it('renders placeholder before intersection', async () => {
    const { LazySection } = await import('@/components/ui/lazy-section');
    render(
      <LazySection height="300px">
        <div data-testid="child">Chart</div>
      </LazySection>
    );
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('renders children after intersection', async () => {
    const { LazySection } = await import('@/components/ui/lazy-section');
    render(
      <LazySection height="300px">
        <div data-testid="child">Chart</div>
      </LazySection>
    );
    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.getByTestId('child')).toBeDefined();
  });
});
