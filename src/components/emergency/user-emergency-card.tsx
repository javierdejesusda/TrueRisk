'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { FirstResponderInfo } from './first-responder-info';

interface UserProfile {
  nickname?: string;
  name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  mobility_level?: string;
  special_needs?: string[];
  has_vehicle?: boolean;
}

export function UserEmergencyCard() {
  const t = useTranslations('Emergency');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showFirstResponder, setShowFirstResponder] = useState(false);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {});
  }, []);

  if (!profile) return null;

  const hasEmergencyContact = profile.emergency_contact_name && profile.emergency_contact_phone;

  const mobilityLabel = (level: string | undefined) => {
    switch (level) {
      case 'full':
        return 'Full';
      case 'limited':
        return 'Limited';
      case 'wheelchair':
        return 'Wheelchair';
      case 'bedridden':
        return 'Bedridden';
      default:
        return level || '---';
    }
  };

  return (
    <>
      <section className="space-y-3">
        <div className="glass rounded-xl border-l-[3px] border-accent-red overflow-hidden">
          {/* Emergency contact section */}
          {hasEmergencyContact ? (
            <div className="p-4 space-y-4">
              {/* Contact row with call button */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-text-muted">
                    {t('yourEmergencyContact')}
                  </p>
                  <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-text-primary truncate">
                    {profile.emergency_contact_name}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                    {profile.emergency_contact_phone}
                  </p>
                </div>
                <a
                  href={`tel:${profile.emergency_contact_phone?.replace(/\s/g, '')}`}
                  aria-label={`${t('callEmergencyContact')}: ${profile.emergency_contact_name}`}
                  className="shrink-0 flex items-center gap-2 bg-gradient-to-br from-red-600 to-red-700 hover:shadow-[0_0_24px_rgba(239,68,68,0.35)] active:bg-red-800 text-white font-bold text-sm rounded-xl px-4 py-3 transition-all shadow-md shadow-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="font-[family-name:var(--font-sans)]">{t('callEmergencyContact')}</span>
                </a>
              </div>

              {/* Medical conditions */}
              {profile.medical_conditions && (
                <div className="rounded-lg border border-accent-yellow/30 bg-accent-yellow/10 p-3">
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-accent-yellow mb-1">
                    {t('medicalInfo')}
                  </p>
                  <p className="font-[family-name:var(--font-sans)] text-sm text-text-primary leading-relaxed">
                    {profile.medical_conditions}
                  </p>
                </div>
              )}

              {/* Mobility and special needs badges */}
              <div className="flex flex-wrap gap-1.5">
                {profile.mobility_level && (
                  <span className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider bg-accent-blue/15 text-accent-blue border border-accent-blue/20 rounded-md px-2 py-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="3" />
                      <path d="M12 8v8" />
                      <path d="M8 21l4-5 4 5" />
                    </svg>
                    {t('mobilityInfo')}: {mobilityLabel(profile.mobility_level)}
                  </span>
                )}
                {profile.special_needs?.map((need) => (
                  <span
                    key={need}
                    className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider bg-white/5 text-text-secondary border border-white/10 rounded-md px-2 py-1"
                  >
                    {need}
                  </span>
                ))}
              </div>

              {/* First Responder Info button */}
              <button
                onClick={() => setShowFirstResponder(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-text-primary">
                  {t('showToFirstResponder')}
                </span>
              </button>
            </div>
          ) : (
            /* No emergency contact CTA */
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-text-primary">
                    {t('noEmergencyContactSet')}
                  </p>
                  <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted mt-0.5">
                    {t('yourEmergencyContact')}
                  </p>
                </div>
              </div>
              <Link
                href="/profile"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-text-primary">
                  {t('addEmergencyContact')}
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* First Responder overlay */}
      <FirstResponderInfo
        open={showFirstResponder}
        onClose={() => setShowFirstResponder(false)}
        profile={profile}
      />
    </>
  );
}
