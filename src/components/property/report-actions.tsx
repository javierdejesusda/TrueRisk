'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface ReportActionsProps {
  reportId: string;
  pdfAvailable: boolean;
}

export function ReportActions({ reportId, pdfAvailable }: ReportActionsProps) {
  const t = useTranslations('PropertyReport');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-end gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Copy link button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.15] bg-transparent text-sm text-text-secondary hover:bg-white/[0.12] hover:border-white/[0.30] hover:text-text-primary hover:backdrop-blur-[20px] hover:shadow-[0_8px_28px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-250 cursor-pointer"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-severity-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-severity-1">{t('linkCopied')}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.343 8.28" />
            </svg>
            {t('copyLink')}
          </>
        )}
      </button>

      {/* Download PDF button */}
      {pdfAvailable && (
        <a
          href={`/api/property/report/${reportId}/pdf`}
          download
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.14] backdrop-blur-[24px] border border-white/[0.18] text-text-primary text-sm font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.24] hover:border-white/[0.35] hover:shadow-[0_8px_32px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-250"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {t('downloadPdf')}
        </a>
      )}
    </motion.div>
  );
}
