'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { CreateAlertForm } from '@/components/alerts/create-alert-form';
import type { AlertSeverity } from '@/types/alert';

// ── Types ────────────────────────────────────────────────────────────────

interface AlertRow {
  id: number;
  severity: number;
  hazard_type: string;
  province_code: string | null;
  title: string;
  description: string;
  is_active: boolean;
  source: string;
  created_at: string;
}

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeAlertsPage() {
  const t = useTranslations('Backoffice');
  const tCommon = useTranslations('Common');
  const tDisaster = useTranslations('DisasterTypes');
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const statusOptions = [
    { value: '', label: t('allStatuses') },
    { value: 'true', label: t('active') },
    { value: 'false', label: t('inactive') },
  ];

  const typeFilterOptions = [
    { value: '', label: t('allTypes') },
    { value: 'flood', label: tDisaster('flood') },
    { value: 'wildfire', label: tDisaster('wildfire') },
    { value: 'drought', label: tDisaster('drought') },
    { value: 'heatwave', label: tDisaster('heatwave') },
  ];

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('active', statusFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setAlerts(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail, alerts remain empty
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter by type client-side
  const filteredAlerts = typeFilter
    ? alerts.filter((a) => a.hazard_type === typeFilter)
    : alerts;

  async function toggleActive(alert: AlertRow) {
    setTogglingId(alert.id);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, is_active: !alert.is_active }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id ? { ...a, is_active: !a.is_active } : a,
          ),
        );
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteAlert(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch('/api/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } else {
        await res.json(); // consume body
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            {t('alertManagement')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-[family-name:var(--font-sans)]">
            {t('alertManagementSubtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          {t('createNewAlert')}
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Select
              label={t('status')}
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              label={t('type')}
              options={typeFilterOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('severity')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('province')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('title')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('created')}
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3">
                      <Skeleton width="40px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="80px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="70px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="150px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="60px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="100px" height="20px" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton width="120px" height="20px" />
                    </td>
                  </tr>
                ))
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    {t('noAlertsFound')}
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-card/50"
                  >
                    <td className="px-4 py-3">
                      <Badge severity={alert.severity as AlertSeverity} size="sm">
                        {alert.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-[family-name:var(--font-mono)] text-[11px] uppercase">
                      {tDisaster.has(alert.hazard_type) ? tDisaster(alert.hazard_type as any) : alert.hazard_type}
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-[family-name:var(--font-mono)]">
                      {alert.province_code ?? 'All'}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      <span className="line-clamp-1">{alert.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={alert.is_active ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {alert.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap font-[family-name:var(--font-mono)] text-[11px]">
                      {formatDate(alert.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={togglingId === alert.id}
                          onClick={() => toggleActive(alert)}
                        >
                          {alert.is_active ? t('deactivate') : t('activate')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === alert.id}
                          onClick={() => setDeleteConfirmId(alert.id)}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create alert modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('createNewAlert')}
      >
        <CreateAlertForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAlerts();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('deleteConfirmText')}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deletingId !== null}
              onClick={() => {
                if (deleteConfirmId !== null) deleteAlert(deleteConfirmId);
              }}
            >
              {t('deleteAlert')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
