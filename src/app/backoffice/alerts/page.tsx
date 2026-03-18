'use client';

import { useState, useEffect, useCallback } from 'react';
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

// ── Filter options ───────────────────────────────────────────────────────

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const typeFilterOptions = [
  { value: '', label: 'All types' },
  { value: 'flood', label: 'Flood' },
  { value: 'wildfire', label: 'Wildfire' },
  { value: 'drought', label: 'Drought' },
  { value: 'heatwave', label: 'Heatwave' },
];

const typeLabels: Record<string, string> = {
  flood: 'Flood',
  wildfire: 'Wildfire',
  drought: 'Drought',
  heatwave: 'Heatwave',
};

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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
          <h1 className="text-2xl font-bold text-text-primary">
            Alert Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Create, monitor, and manage emergency alerts
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create New Alert
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              label="Type"
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
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Severity
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Type
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Province
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Title
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Actions
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
                    No alerts found
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
                    <td className="px-4 py-3 text-text-primary">
                      {typeLabels[alert.hazard_type] ?? alert.hazard_type}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
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
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
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
                          {alert.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === alert.id}
                          onClick={() => setDeleteConfirmId(alert.id)}
                        >
                          Delete
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
        title="Create New Alert"
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
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this alert? This action cannot be
            undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deletingId !== null}
              onClick={() => {
                if (deleteConfirmId !== null) deleteAlert(deleteConfirmId);
              }}
            >
              Delete Alert
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
