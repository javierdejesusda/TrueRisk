'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ProfileForm } from '@/components/profile/profile-form';
import { NotificationPrefs } from '@/components/profile/notification-prefs';
import { NotificationChannels } from '@/components/profile/notification-channels';
import { AlertIntelligencePrefs } from '@/components/profile/alert-intelligence-prefs';

export default function ProfilePage() {
  const t = useTranslations('Profile');

  return (
    <motion.div
      className="h-screen pt-20 px-6 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
          <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
            {t('subtitle')}
          </p>
        </div>

        {/* Notification preferences */}
        <div className="mb-6">
          <NotificationPrefs />
        </div>

        {/* Notification channels (WhatsApp, Telegram) */}
        <div className="mb-6">
          <NotificationChannels />
        </div>

        {/* Alert intelligence preferences */}
        <div className="mb-6">
          <AlertIntelligencePrefs />
        </div>

        {/* Profile form (province, residence, special needs) */}
        <ProfileForm />
      </div>
    </motion.div>
  );
}
