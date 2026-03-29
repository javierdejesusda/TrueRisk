'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function CookiesPage() {
  const t = useTranslations('Legal.cookies');

  const sections = [
    { id: 'what-are-cookies', label: t('whatAreCookies.title') },
    { id: 'cookies-we-use', label: t('cookiesWeUse.title') },
    { id: 'local-storage', label: t('localStorage.title') },
    { id: 'no-tracking', label: t('noTracking.title') },
    { id: 'third-party-cookies', label: t('thirdPartyCookies.title') },
    { id: 'managing', label: t('managing.title') },
    { id: 'changes', label: t('changes.title') },
  ];

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="what-are-cookies">{t('whatAreCookies.title')}</h2>
      <p>{t('whatAreCookies.content')}</p>

      <h2 id="cookies-we-use">{t('cookiesWeUse.title')}</h2>
      <p>{t('cookiesWeUse.intro')}</p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>{t('cookiesWeUse.locale.name')}</code></td>
            <td>{t('cookiesWeUse.locale.type')}</td>
            <td>{t('cookiesWeUse.locale.purpose')}</td>
            <td>{t('cookiesWeUse.locale.duration')}</td>
          </tr>
          <tr>
            <td><code>{t('cookiesWeUse.session.name')}</code></td>
            <td>{t('cookiesWeUse.session.type')}</td>
            <td>{t('cookiesWeUse.session.purpose')}</td>
            <td>{t('cookiesWeUse.session.duration')}</td>
          </tr>
          <tr>
            <td><code>{t('cookiesWeUse.secureSession.name')}</code></td>
            <td>{t('cookiesWeUse.secureSession.type')}</td>
            <td>{t('cookiesWeUse.secureSession.purpose')}</td>
            <td>{t('cookiesWeUse.secureSession.duration')}</td>
          </tr>
        </tbody>
      </table>

      <h2 id="local-storage">{t('localStorage.title')}</h2>
      <p>{t('localStorage.intro')}</p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>{t('localStorage.province.name')}</code></td>
            <td>{t('localStorage.province.purpose')}</td>
          </tr>
          <tr>
            <td><code>{t('localStorage.consent.name')}</code></td>
            <td>{t('localStorage.consent.purpose')}</td>
          </tr>
        </tbody>
      </table>

      <h2 id="no-tracking">{t('noTracking.title')}</h2>
      <p>{t('noTracking.content')}</p>

      <h2 id="third-party-cookies">{t('thirdPartyCookies.title')}</h2>
      <p>{t('thirdPartyCookies.content')}</p>

      <h2 id="managing">{t('managing.title')}</h2>
      <p>{t('managing.content')}</p>

      <h2 id="changes">{t('changes.title')}</h2>
      <p>{t('changes.content')}</p>
    </LegalPageShell>
  );
}
