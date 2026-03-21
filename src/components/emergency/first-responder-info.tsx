'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  nickname?: string;
  name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  mobility_level?: string;
  special_needs?: string[];
}

interface FirstResponderInfoProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export function FirstResponderInfo({ open, onClose, profile }: FirstResponderInfoProps) {
  const t = useTranslations('Emergency');

  const displayName = profile.nickname || profile.name || '---';

  const mobilityLabel = (level: string | undefined) => {
    switch (level) {
      case 'full':
        return 'Full mobility';
      case 'limited':
        return 'Limited mobility';
      case 'wheelchair':
        return 'Wheelchair user';
      case 'bedridden':
        return 'Bedridden';
      default:
        return level || '---';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl bg-bg-primary border border-white/10 p-6 space-y-6 overflow-y-auto max-h-[90vh]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label={t('closeInfo')}
              className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center space-y-1 pt-2">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-accent-red">
                {t('firstResponderInfo')}
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
                {displayName}
              </h1>
            </div>

            {/* Medical conditions */}
            <div className="rounded-xl border-2 border-accent-yellow bg-accent-yellow/10 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-accent-yellow mb-3">
                {t('medicalInfo')}
              </h2>
              <p className="font-[family-name:var(--font-sans)] text-xl font-semibold text-text-primary leading-relaxed">
                {profile.medical_conditions || '---'}
              </p>
            </div>

            {/* Mobility */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-accent-blue mb-3">
                {t('mobilityInfo')}
              </h2>
              <p className="font-[family-name:var(--font-sans)] text-xl font-semibold text-text-primary">
                {mobilityLabel(profile.mobility_level)}
              </p>
            </div>

            {/* Special needs */}
            {profile.special_needs && profile.special_needs.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-accent-orange mb-3">
                  Special Needs
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.special_needs.map((need) => (
                    <span
                      key={need}
                      className="font-[family-name:var(--font-sans)] text-lg font-semibold text-text-primary bg-white/10 border border-white/10 rounded-lg px-4 py-2"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency contact */}
            {profile.emergency_contact_name && profile.emergency_contact_phone && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-accent-green mb-3">
                  {t('yourEmergencyContact')}
                </h2>
                <p className="font-[family-name:var(--font-sans)] text-xl font-semibold text-text-primary">
                  {profile.emergency_contact_name}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-lg text-text-secondary mt-1">
                  {profile.emergency_contact_phone}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
