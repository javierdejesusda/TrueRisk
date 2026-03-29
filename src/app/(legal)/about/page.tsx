'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function AboutPage() {
  const t = useTranslations('Legal.about');

  const sections = [
    { id: 'mission', label: t('mission.title') },
    { id: 'project', label: t('project.title') },
    { id: 'what-we-do', label: t('whatWeDo.title') },
    { id: 'third-party', label: t('thirdParty.title') },
    { id: 'tech-stack', label: t('techStack.title') },
    { id: 'contribute', label: t('contribute.title') },
    { id: 'contact', label: t('contact.title') },
  ];

  const services = ['google', 'github', 'openmeteo', 'aemet', 'openfreemap', 'nominatim', 'ine'] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <h2 id="mission">{t('mission.title')}</h2>
      <p>{t('mission.content')}</p>

      <h2 id="project">{t('project.title')}</h2>
      <p>{t('project.content')}</p>

      <h2 id="what-we-do">{t('whatWeDo.title')}</h2>
      <p>{t('whatWeDo.content')}</p>

      <h2 id="third-party">{t('thirdParty.title')}</h2>
      <p>{t('thirdParty.intro')}</p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc}>
              <td><strong>{t(`thirdParty.${svc}.name`)}</strong></td>
              <td>{t(`thirdParty.${svc}.description`)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="tech-stack">{t('techStack.title')}</h2>
      <ul>
        <li>{t('techStack.frontend')}</li>
        <li>{t('techStack.backend')}</li>
        <li>{t('techStack.ml')}</li>
        <li>{t('techStack.infra')}</li>
      </ul>

      <h2 id="contribute">{t('contribute.title')}</h2>
      <p>{t('contribute.content')}</p>
      <p>
        <a href={`https://${t('contribute.github')}`} target="_blank" rel="noopener noreferrer">
          {t('contribute.github')}
        </a>
      </p>

      <h2 id="contact">{t('contact.title')}</h2>
      <p>{t('contact.content')}</p>
      <ul>
        <li>
          <a href={`mailto:${t('contact.email')}`}>{t('contact.email')}</a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
