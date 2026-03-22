'use client';

import { Plus, Trash2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { MeetingPoint } from '@/hooks/use-emergency-plan';

interface MeetingPointPickerProps {
  points: MeetingPoint[];
  setPoints: (points: MeetingPoint[]) => void;
}

export function MeetingPointPicker({ points, setPoints }: MeetingPointPickerProps) {
  function addPoint() {
    if (points.length >= 3) return;
    setPoints([...points, { name: '', address: null, lat: null, lon: null, notes: null }]);
  }

  function removePoint(idx: number) {
    setPoints(points.filter((_, i) => i !== idx));
  }

  function updatePoint(idx: number, field: keyof MeetingPoint, value: string | number | null) {
    const updated = [...points];
    updated[idx] = { ...updated[idx], [field]: value };
    setPoints(updated);
  }

  return (
    <Card variant="glass" padding="md">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Meeting Points</h3>
      <p className="text-sm text-text-muted mb-4">
        Set up to 3 meeting points where your household will gather during an emergency.
        Choose locations that are safe, accessible, and easy to find.
      </p>

      <div className="flex flex-col gap-3">
        {points.map((p, i) => (
          <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-green/10 shrink-0 mt-1">
              <MapPin className="w-4 h-4 text-accent-green" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Point name (e.g. Town square)"
                value={p.name}
                onChange={(e) => updatePoint(i, 'name', e.target.value)}
              />
              <Input
                placeholder="Address"
                value={p.address ?? ''}
                onChange={(e) => updatePoint(i, 'address', e.target.value || null)}
              />
              <Input
                placeholder="Notes (e.g. Near the fountain)"
                value={p.notes ?? ''}
                onChange={(e) => updatePoint(i, 'notes', e.target.value || null)}
                className="sm:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={() => removePoint(i)}
              className="p-2 text-text-muted hover:text-accent-red transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {points.length < 3 && (
        <button
          type="button"
          onClick={addPoint}
          className="mt-3 flex items-center gap-1.5 text-sm text-accent-green hover:text-accent-green/80 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add meeting point
        </button>
      )}

      {points.length === 3 && (
        <p className="mt-3 text-xs text-text-muted">Maximum of 3 meeting points reached</p>
      )}
    </Card>
  );
}
