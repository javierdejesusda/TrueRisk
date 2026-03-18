'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ────────────────────────────────────────────────────────────────

interface Citizen {
  id: number;
  nickname: string;
  role: string;
  province_code: string;
  residence_type: string;
  special_needs: string[];
  created_at: string;
}

// ── Label maps ───────────────────────────────────────────────────────────

const residenceLabels: Record<string, string> = {
  sotano: 'Sotano',
  planta_baja: 'Planta Baja',
  piso_bajo: 'Piso Bajo',
  piso_alto: 'Piso Alto',
  atico: 'Atico',
  casa_unifamiliar: 'Casa Unifamiliar',
  caravana: 'Caravana',
};

const needLabels: Record<string, string> = {
  wheelchair: 'Wheelchair',
  elderly: 'Elderly',
  children: 'Children',
  pets: 'Pets',
  medical_equipment: 'Medical Equipment',
  hearing_impaired: 'Hearing Impaired',
  visual_impaired: 'Visual Impaired',
  respiratory: 'Respiratory',
};

const provinceColors: Record<string, string> = {
  Valencia: 'bg-severity-5/15 text-severity-5',
  Alicante: 'bg-severity-4/15 text-severity-4',
  Murcia: 'bg-severity-4/15 text-severity-4',
  Barcelona: 'bg-severity-3/15 text-severity-3',
  Madrid: 'bg-severity-2/15 text-severity-2',
};

const residenceColors: Record<string, string> = {
  sotano: 'bg-accent-red/15 text-accent-red',
  planta_baja: 'bg-accent-yellow/15 text-accent-yellow',
  piso_bajo: 'bg-accent-blue/15 text-accent-blue',
  piso_alto: 'bg-accent-green/15 text-accent-green',
  atico: 'bg-accent-green/15 text-accent-green',
  casa_unifamiliar: 'bg-accent-blue/15 text-accent-blue',
  caravana: 'bg-accent-red/15 text-accent-red',
};

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeCitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCitizens() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/citizens');
        const data = await res.json();

        if (res.ok) {
          setCitizens(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }

    fetchCitizens();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Registered Citizens
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View and manage registered users ({citizens.length} total)
        </p>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">
                  NickName
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Province
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Residence Type
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Special Needs
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton width="80px" height="16px" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : citizens.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    No citizens registered yet
                  </td>
                </tr>
              ) : (
                citizens.map((citizen) => (
                  <tr
                    key={citizen.id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-card/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-card text-xs font-medium text-text-secondary">
                          {citizen.nickname.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-text-primary">
                          {citizen.nickname}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {citizen.province_code ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            provinceColors[citizen.province_code] ??
                            'bg-bg-card text-text-secondary'
                          }`}
                        >
                          {citizen.province_code}
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {citizen.residence_type ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            residenceColors[citizen.residence_type] ??
                            'bg-bg-card text-text-secondary'
                          }`}
                        >
                          {residenceLabels[citizen.residence_type] ??
                            citizen.residence_type}
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {citizen.special_needs.length > 0 ? (
                          citizen.special_needs.map((need) => (
                            <Badge
                              key={need}
                              variant="neutral"
                              size="sm"
                            >
                              {needLabels[need] ?? need}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-text-muted text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          citizen.role === 'backoffice' ? 'info' : 'neutral'
                        }
                        size="sm"
                      >
                        {citizen.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(citizen.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
