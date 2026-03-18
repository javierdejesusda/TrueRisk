import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);

function TemperatureDisplay({ temperature }: { temperature: number | null }) {
  return (
    <span data-testid="temp">
      {temperature != null ? `${temperature.toFixed(1)}°C` : '—°C'}
    </span>
  );
}

describe('TemperatureDisplay', () => {
  it('renders temperature when provided', () => {
    render(<TemperatureDisplay temperature={22.5} />);
    expect(screen.getByTestId('temp')).toHaveTextContent('22.5°C');
  });

  it('renders dash when temperature is null', () => {
    render(<TemperatureDisplay temperature={null} />);
    expect(screen.getByTestId('temp')).toHaveTextContent('—°C');
  });

  it('renders 0 correctly (not falsy)', () => {
    render(<TemperatureDisplay temperature={0} />);
    expect(screen.getByTestId('temp')).toHaveTextContent('0.0°C');
  });

  it('renders negative temperatures', () => {
    render(<TemperatureDisplay temperature={-3.2} />);
    expect(screen.getByTestId('temp')).toHaveTextContent('-3.2°C');
  });
});
