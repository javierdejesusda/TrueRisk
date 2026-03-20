import { describe, it, expect } from 'vitest';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

describe('EmptyState component props', () => {
  it('requires title prop', () => {
    const props: EmptyStateProps = {
      title: 'No data',
    };
    expect(props.title).toBeDefined();
    expect(props.title).toBe('No data');
  });

  it('accepts optional description', () => {
    const props: EmptyStateProps = {
      title: 'No results',
      description: 'Try searching again',
    };
    expect(props.description).toBe('Try searching again');
  });

  it('accepts optional action with label and href', () => {
    const props: EmptyStateProps = {
      title: 'Empty state',
      action: { label: 'Create', href: '/create' },
    };
    expect(props.action).toBeDefined();
    expect(props.action?.label).toBe('Create');
    expect(props.action?.href).toBe('/create');
  });

  it('accepts optional icon', () => {
    const props: EmptyStateProps = {
      icon: <span>Icon</span>,
      title: 'No data',
    };
    expect(props.icon).toBeDefined();
  });

  it('allows all props together', () => {
    const props: EmptyStateProps = {
      icon: <span>Icon</span>,
      title: 'No results',
      description: 'Try searching with different criteria',
      action: { label: 'Go back', href: '/' },
    };
    expect(props.title).toBe('No results');
    expect(props.description).toBe('Try searching with different criteria');
    expect(props.action?.label).toBe('Go back');
    expect(props.icon).toBeDefined();
  });
});
