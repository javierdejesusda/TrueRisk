'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import type { FamilyMemberStatus } from '@/hooks/use-safety-check';
import { STATUS_COLORS, STATUS_LABELS, timeAgo } from './utils';

interface FamilyStatusListProps {
  familyStatus: FamilyMemberStatus[];
  onRequestCheckIn: (userId: number) => Promise<void>;
}

function hoursSinceCheckIn(dateStr: string | undefined): number {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
}

export function FamilyStatusList({ familyStatus, onRequestCheckIn }: FamilyStatusListProps) {
  const t = useTranslations('Safety');
  const risk = useAppStore((s) => s.risk);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());

  const isHighRisk = risk && risk.composite_score >= 60;

  async function handleRequestCheckIn(userId: number) {
    try {
      await onRequestCheckIn(userId);
      setRequestedIds((prev) => new Set(prev).add(userId));
    } catch {
      // error handled in hook
    }
  }

  if (familyStatus.length === 0) {
    return (
      <div className="glass-heavy rounded-2xl p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary mb-3">
          {t('familyStatus')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary">
          {t('noFamily')}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-heavy rounded-2xl p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary mb-4">
        {t('familyStatus')}
      </h2>

      <div className="flex flex-col gap-3">
        {familyStatus.map((member) => {
          const checkIn = member.latest_check_in;
          const hasStatus = checkIn !== null;
          const status = checkIn?.status;
          const hoursAgo = hoursSinceCheckIn(checkIn?.checked_in_at);
          const noResponse = !hasStatus || hoursAgo > 6;
          const showUrgent = noResponse && isHighRisk;

          return (
            <div
              key={member.user_id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              {/* Status dot */}
              <div className="relative shrink-0">
                <span
                  className={[
                    'block w-3 h-3 rounded-full',
                    showUrgent
                      ? 'bg-red-400 animate-pulse'
                      : status
                        ? STATUS_COLORS[status]
                        : 'bg-white/20',
                  ].join(' ')}
                />
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-text-primary truncate">
                    {member.display_name || member.nickname}
                  </span>
                  <span className="font-[family-name:var(--font-sans)] text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-text-secondary">
                    {member.relationship}
                  </span>
                </div>
                <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mt-0.5">
                  {showUrgent ? (
                    <span className="text-red-400">{t('noResponse')}</span>
                  ) : hasStatus ? (
                    <>
                      {t(STATUS_LABELS[status!])} — {timeAgo(checkIn!.checked_in_at)} {t('ago')}
                    </>
                  ) : (
                    <span className="text-text-secondary/60">{t('noResponse')}</span>
                  )}
                </p>
              </div>

              {/* Request check-in button */}
              <button
                onClick={() => handleRequestCheckIn(member.user_id)}
                disabled={requestedIds.has(member.user_id)}
                className="shrink-0 font-[family-name:var(--font-sans)] text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
              >
                {requestedIds.has(member.user_id) ? t('requestSent') : t('requestCheckIn')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
