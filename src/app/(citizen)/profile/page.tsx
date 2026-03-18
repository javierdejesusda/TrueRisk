'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { useRiskScore } from '@/hooks/use-risk-score';

interface Province {
  ine_code: string;
  name: string;
}

export default function SettingsPage() {
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const { risk } = useRiskScore();
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetch('/api/provinces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.provinces) setProvinces(data.provinces);
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure your province and view risk summary
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <Card padding="md">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-secondary">Province</span>
              <select
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                {provinces.length > 0 ? (
                  provinces.map((p) => (
                    <option key={p.ine_code} value={p.ine_code}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value={provinceCode}>Loading...</option>
                )}
              </select>
            </label>
          </div>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
          Summary
        </h2>
        <Card padding="md">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Risk Score
            </span>
            {risk ? (
              <span
                className={[
                  'text-2xl font-bold',
                  risk.composite_score < 30
                    ? 'text-accent-green'
                    : risk.composite_score < 60
                      ? 'text-accent-yellow'
                      : 'text-accent-red',
                ].join(' ')}
              >
                {risk.composite_score.toFixed(0)}
              </span>
            ) : (
              <span className="text-sm text-text-muted">N/A</span>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
