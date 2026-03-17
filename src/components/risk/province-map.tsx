'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export interface ProvinceMapProps {
  riskByProvince?: Record<string, number>;
  selectedProvince?: string;
  onProvinceSelect?: (province: string) => void;
}

interface ProvinceTile {
  code: string;
  name: string;
  abbr: string;
}

/**
 * Spain's autonomous communities arranged in a geographic grid layout.
 * null entries represent empty cells in the grid.
 */
const GRID_LAYOUT: (ProvinceTile | null)[][] = [
  // Row 0 - Northern coast
  [
    { code: 'C', name: 'Galicia', abbr: 'GAL' },
    { code: 'O', name: 'Asturias', abbr: 'AST' },
    { code: 'S', name: 'Cantabria', abbr: 'CAN' },
    { code: 'BI', name: 'Pais Vasco', abbr: 'PVA' },
    { code: 'NA', name: 'Navarra', abbr: 'NAV' },
    null,
  ],
  // Row 1 - Northern interior + Cataluna
  [
    null,
    { code: 'LE', name: 'Castilla y Leon', abbr: 'CYL' },
    { code: 'LO', name: 'La Rioja', abbr: 'LRJ' },
    { code: 'Z', name: 'Aragon', abbr: 'ARA' },
    { code: 'B', name: 'Cataluna', abbr: 'CAT' },
    null,
  ],
  // Row 2 - Center
  [
    null,
    { code: 'CC', name: 'Extremadura', abbr: 'EXT' },
    { code: 'M', name: 'Madrid', abbr: 'MAD' },
    { code: 'TO', name: 'Castilla-La Mancha', abbr: 'CLM' },
    { code: 'V', name: 'C. Valenciana', abbr: 'VAL' },
    { code: 'PM', name: 'Baleares', abbr: 'BAL' },
  ],
  // Row 3 - South
  [
    null,
    null,
    { code: 'SE', name: 'Andalucia', abbr: 'AND' },
    { code: 'MU', name: 'Murcia', abbr: 'MUR' },
    null,
    null,
  ],
  // Row 4 - Islands (Canarias offset)
  [
    { code: 'TF', name: 'Canarias', abbr: 'CAN*' },
    null,
    null,
    null,
    null,
    null,
  ],
];

function getRiskColor(score: number | undefined): string {
  if (score === undefined) return 'var(--color-border)';
  if (score < 30) return 'var(--color-accent-green)';
  if (score < 60) return 'var(--color-accent-yellow)';
  if (score < 80) return 'var(--color-accent-orange)';
  return 'var(--color-accent-red)';
}

function getRiskBgClass(score: number | undefined): string {
  if (score === undefined) return 'bg-bg-card';
  if (score < 30) return 'bg-accent-green/10';
  if (score < 60) return 'bg-accent-yellow/10';
  if (score < 80) return 'bg-accent-orange/10';
  return 'bg-accent-red/10';
}

function getRiskLabel(score: number): string {
  if (score < 30) return 'Low';
  if (score < 60) return 'Moderate';
  if (score < 80) return 'High';
  return 'Critical';
}

export function ProvinceMap({
  riskByProvince = {},
  selectedProvince,
  onProvinceSelect,
}: ProvinceMapProps) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  const handleSelect = useCallback(
    (code: string) => {
      onProvinceSelect?.(code);
    },
    [onProvinceSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, code: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(code);
      }
    },
    [handleSelect],
  );

  return (
    <Card padding="md">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Risk by Region
        </h3>

        <div
          className="flex flex-col gap-1.5 sm:gap-2"
          role="grid"
          aria-label="Spain province risk map"
        >
          {GRID_LAYOUT.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-6 gap-1.5 sm:gap-2"
              role="row"
            >
              {row.map((tile, colIndex) => {
                if (!tile) {
                  return (
                    <div
                      key={`empty-${rowIndex}-${colIndex}`}
                      className="aspect-square"
                      role="gridcell"
                      aria-hidden="true"
                    />
                  );
                }

                const score = riskByProvince[tile.code];
                const isSelected = selectedProvince === tile.code;
                const isHovered = hoveredTile === tile.code;

                return (
                  <motion.button
                    key={tile.code}
                    type="button"
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`${tile.name}${score !== undefined ? `, risk score ${Math.round(score)}, ${getRiskLabel(score)}` : ', no risk data'}`}
                    aria-selected={isSelected}
                    className={[
                      'relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-1 text-center transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green',
                      getRiskBgClass(score),
                      isSelected
                        ? 'border-accent-green shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'border-border hover:border-border-hover',
                    ].join(' ')}
                    style={{
                      borderColor: isSelected
                        ? 'var(--color-accent-green)'
                        : undefined,
                    }}
                    onClick={() => handleSelect(tile.code)}
                    onKeyDown={(e) => handleKeyDown(e, tile.code)}
                    onMouseEnter={() => setHoveredTile(tile.code)}
                    onMouseLeave={() => setHoveredTile(null)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold text-text-primary leading-tight">
                      {tile.abbr}
                    </span>
                    {score !== undefined && (
                      <span
                        className="mt-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums"
                        style={{ color: getRiskColor(score) }}
                      >
                        {Math.round(score)}
                      </span>
                    )}

                    {/* Tooltip */}
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.12 }}
                        className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-secondary px-2.5 py-1.5 text-xs shadow-lg"
                        role="tooltip"
                      >
                        <span className="font-medium text-text-primary">
                          {tile.name}
                        </span>
                        {score !== undefined && (
                          <>
                            <span className="mx-1.5 text-text-muted">|</span>
                            <span style={{ color: getRiskColor(score) }}>
                              {Math.round(score)} - {getRiskLabel(score)}
                            </span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs text-text-muted">Risk level:</span>
          {[
            { label: 'Low', color: 'bg-accent-green' },
            { label: 'Moderate', color: 'bg-accent-yellow' },
            { label: 'High', color: 'bg-accent-orange' },
            { label: 'Critical', color: 'bg-accent-red' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-sm ${item.color}`}
              />
              <span className="text-xs text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
