'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import type { FamilyMemberStatus, FamilyLink } from '@/hooks/use-safety-check';

interface FamilyLinkManagerProps {
  familyStatus: FamilyMemberStatus[];
  pendingLinks: FamilyLink[];
  onCreateLink: (nickname: string, relationship?: string) => Promise<unknown>;
  onAcceptLink: (linkId: number) => Promise<void>;
  onDeleteLink: (linkId: number) => Promise<void>;
}

export function FamilyLinkManager({ familyStatus, pendingLinks, onCreateLink, onAcceptLink, onDeleteLink }: FamilyLinkManagerProps) {
  const t = useTranslations('Safety');
  const authUser = useAppStore((s) => s.authUser);
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('family');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);
    try {
      await onCreateLink(nickname.trim(), relationship);
      setNickname('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add family member');
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
            onChange={(e) => { setNickname(e.target.value); setFormError(null); setFormSuccess(false); }}
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
            className="px-5 py-2.5 rounded-xl bg-accent-green/20 text-accent-green font-[family-name:var(--font-sans)] text-sm font-semibold hover:bg-accent-green/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            )}
            {t('add')}
          </button>
        </div>
        {formError && (
          <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-red-400">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-accent-green">
            {t('linkRequestSent')}
          </p>
        )}
      </form>

      {/* Accepted links */}
      {familyStatus.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          <h3 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('accepted')}
          </h3>
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
                onClick={() => onDeleteLink(member.link_id)}
                className="font-[family-name:var(--font-sans)] text-[10px] px-2 py-1 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                {t('remove')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending links */}
      {pendingLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('pending')}
          </h3>
          {pendingLinks.map((link) => {
            const isInvitedByOther = authUser && link.linked_user_id === authUser.id;
            return (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-text-primary truncate block">
                    {link.linked_user_display_name || link.linked_user_nickname}
                  </span>
                  <span className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                    {link.relationship}
                  </span>
                </div>
                {isInvitedByOther ? (
                  <button
                    onClick={() => onAcceptLink(link.id)}
                    className="font-[family-name:var(--font-sans)] text-[10px] px-3 py-1 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors cursor-pointer font-semibold"
                  >
                    {t('accept')}
                  </button>
                ) : (
                  <>
                    <span className="font-[family-name:var(--font-sans)] text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">
                      {t('pending')}
                    </span>
                    <button
                      onClick={() => onDeleteLink(link.id)}
                      className="font-[family-name:var(--font-sans)] text-[10px] px-2 py-1 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      {t('remove')}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
