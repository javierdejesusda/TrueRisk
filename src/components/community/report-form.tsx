'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import type { CreateReportData } from '@/hooks/use-community-reports';

const HAZARD_OPTIONS = [
  { value: 'flood', label: 'Inundacion' },
  { value: 'road_blocked', label: 'Carretera cortada' },
  { value: 'power_outage', label: 'Corte de luz' },
  { value: 'structural_damage', label: 'Dano estructural' },
  { value: 'other', label: 'Otro' },
] as const;

interface ReportFormProps {
  onSubmit: (data: CreateReportData) => Promise<unknown>;
  onClose: () => void;
}

export function ReportForm({ onSubmit, onClose }: ReportFormProps) {
  const provinceCode = useAppStore((s) => s.provinceCode);
  const [hazardType, setHazardType] = useState<CreateReportData['hazard_type']>('flood');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('No se pudo obtener la ubicacion');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setError('Necesitas compartir tu ubicacion');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        province_code: provinceCode,
        hazard_type: hazardType,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        description: description || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="glass-heavy rounded-2xl w-full max-w-md p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-[family-name:var(--font-display)] font-bold text-text-primary">Reportar peligro</h2>
          <button type="button" onClick={onClose} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors text-lg">&times;</button>
        </div>

        <div className="space-y-1">
          <label className="font-[family-name:var(--font-sans)] text-xs uppercase tracking-wider text-text-secondary">Tipo de peligro</label>
          <select
            value={hazardType}
            onChange={(e) => setHazardType(e.target.value as CreateReportData['hazard_type'])}
            className="w-full font-[family-name:var(--font-sans)] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary"
          >
            {HAZARD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-[family-name:var(--font-sans)] text-xs uppercase tracking-wider text-text-secondary">Gravedad: <span className="font-[family-name:var(--font-mono)]">{severity}/5</span></label>
          <input
            type="range"
            min={1}
            max={5}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>

        <div className="space-y-1">
          <label className="font-[family-name:var(--font-sans)] text-xs uppercase tracking-wider text-text-secondary">Descripcion (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full font-[family-name:var(--font-sans)] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary resize-none"
            placeholder="Describe lo que ves..."
          />
        </div>

        <button
          type="button"
          onClick={getLocation}
          disabled={locating}
          className="w-full font-[family-name:var(--font-sans)] text-xs font-medium bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 hover:bg-white/10 transition-colors text-text-secondary disabled:opacity-50"
        >
          {locating ? 'Obteniendo ubicacion...' : coords ? <span>Ubicacion: <span className="font-[family-name:var(--font-mono)]">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span></span> : 'Usar mi ubicacion'}
        </button>

        {error && <p className="font-[family-name:var(--font-sans)] text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !coords}
          className="w-full text-xs bg-accent-green text-[#050508] font-semibold hover:shadow-[0_0_20px_rgba(34,245,140,0.3)] rounded-lg px-3 py-2.5 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </form>
    </div>
  );
}
