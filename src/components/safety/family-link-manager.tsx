'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FamilyMemberStatus } from '@/hooks/use-safety-check';

interface FamilyLinkManagerProps {
  familyStatus: FamilyMemberStatus[];
  onCreateLink: (nickname: string, relationship?: string) => Promise<unknown>;
  onAcceptLink: (linkId: number) => Promise<void>;
  onDeleteLink: (linkId: number) => Promise<void>;
}

export function FamilyLinkManager({ familyStatus, onCreateLink, onDeleteLink }: FamilyLinkManagerProps) {
  const t = useTranslations('Safety');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('family');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateLink(nickname.trim(), relationship);
      setNickname('');
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass-heavy rounded-2xl p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary mb-4">
        {t('manageLinks')}
      </h2>

      {/* Add family member form */}
      <form onSubmit={handleAddLink} className="mb-5">
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary mb-3">
          {t('addFamily')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('nickname')}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 font-[family-name:var(--font-sans)] focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary font-[family-name:var(--font-sans)] focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
          >
            <option value="family" className="bg-[#050508]">{t('family')}</option>
            <option value="friend" className="bg-[#050508]">{t('friend')}</option>
            <option value="neighbor" className="bg-[#050508]">{t('neighbor')}</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className="px-5 py-2.5 rounded-xl bg-accent-green/20 text-accent-green font-[family-name:var(--font-sans)] text-sm font-semibold hover:bg-accent-green/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {t('add')}
          </button>
        </div>
      </form>

      {/* Existing links */}
      {familyStatus.length > 0 && (
        <div className="flex flex-col gap-2">
          {familyStatus.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex-1 min-w-0">
                <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-text-primary truncate block">
                  {member.display_name || member.nickname}
                </span>
                <span className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                  {member.relationship}
                </span>
              </div>
              <span className="font-[family-name:var(--font-sans)] text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400">
                {t('accepted')}
              </span>
              <button
                onClick={() => onDeleteLink(member.user_id)}
                className="font-[family-name:var(--font-sans)] text-[10px] px-2 py-1 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                {t('remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
