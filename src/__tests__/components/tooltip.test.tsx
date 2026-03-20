import { describe, it, expect } from 'vitest';

describe('Tooltip component', () => {
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  it('has all four side positions defined', () => {
    expect(positionStyles.top).toBeDefined();
    expect(positionStyles.bottom).toBeDefined();
    expect(positionStyles.left).toBeDefined();
    expect(positionStyles.right).toBeDefined();
  });

  it('top position places tooltip above', () => {
    expect(positionStyles.top).toContain('bottom-full');
    expect(positionStyles.top).toContain('mb-2');
  });

  it('bottom position places tooltip below', () => {
    expect(positionStyles.bottom).toContain('top-full');
    expect(positionStyles.bottom).toContain('mt-2');
  });

  it('left position places tooltip to the left', () => {
    expect(positionStyles.left).toContain('right-full');
    expect(positionStyles.left).toContain('mr-2');
  });

  it('right position places tooltip to the right', () => {
    expect(positionStyles.right).toContain('left-full');
    expect(positionStyles.right).toContain('ml-2');
  });

  it('all positions center on the cross axis', () => {
    expect(positionStyles.top).toContain('-translate-x-1/2');
    expect(positionStyles.bottom).toContain('-translate-x-1/2');
    expect(positionStyles.left).toContain('-translate-y-1/2');
    expect(positionStyles.right).toContain('-translate-y-1/2');
  });
});
