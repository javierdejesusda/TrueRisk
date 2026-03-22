'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { SafetyStatus } from '@/hooks/use-safety-check';
import { STATUS_LABELS, timeAgo } from './utils';

interface SafetyCheckButtonProps {
  onCheckIn: (status: SafetyStatus, message?: string) => Promise<unknown>;
  lastCheckIn?: { status: SafetyStatus; checked_in_at: string } | null;
}

const STATUS_CONFIG: { status: SafetyStatus; colorClass: string; bgClass: string; icon: string }[] = [
  { status: 'safe', colorClass: 'text-green-400', bgClass: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20', icon: '✓' },
  { status: 'need_help', colorClass: 'text-red-400', bgClass: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20', icon: '!' },
  { status: 'evacuating', colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20', icon: '→' },
  { status: 'sheltering', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20', icon: '⌂' },
];

export function SafetyCheckButton({ onCheckIn, lastCheckIn }: SafetyCheckButtonProps) {
  const t = useTranslations('Safety');
  const [selectedStatus, setSelectedStatus] = useState<SafetyStatus | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit() {
    if (!selectedStatus) return;
    setIsSubmitting(true);
    try {
      await onCheckIn(selectedStatus, message || undefined);
      setConfirmed(true);
      setMessage('');
      setTimeout(() => {
        setConfirmed(false);
        setSelectedStatus(null);
      }, 3000);
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass-heavy rounded-2xl p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary mb-4">
        {t('checkIn')}
      </h2>

      {confirmed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2 py-6"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <p className="font-[family-name:var(--font-sans)] text-sm text-text-primary">
            {t('checkedIn')}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_CONFIG.map(({ status, colorClass, bgClass, icon }) => (
              <motion.button
                key={status}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                className={[
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer',
                  bgClass,
                  selectedStatus === status ? 'ring-2 ring-white/20 scale-[1.02]' : '',
                ].join(' ')}
              >
                <span className={`text-2xl ${colorClass}`}>{icon}</span>
                <span className={`font-[family-name:var(--font-sans)] text-sm font-medium ${colorClass}`}>
                  {t(STATUS_LABELS[status])}
                </span>
              </motion.button>
            ))}
          </div>

          {selectedStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('message')}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 font-[family-name:var(--font-sans)] resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-accent-green/20 text-accent-green font-[family-name:var(--font-sans)] text-sm font-semibold hover:bg-accent-green/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? '...' : t('checkIn')}
              </motion.button>
            </motion.div>
          )}
        </>
      )}

      {lastCheckIn && !confirmed && (
        <p className="mt-3 text-xs text-text-secondary font-[family-name:var(--font-sans)]">
          {t('checkedIn')} {timeAgo(lastCheckIn.checked_in_at)} {t('ago')}
        </p>
      )}
    </div>
  );
}
