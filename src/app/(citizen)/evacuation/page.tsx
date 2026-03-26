'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/page-transition';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useEvacuationRoutes, useSafePoints, type EvacuationRoute } from '@/hooks/use-evacuation';
import { useAppStore } from '@/store/app-store';

const POINT_TYPE_ICONS: Record<string, string> = {
  hospital: '\u{1F3E5}',
  shelter: '\u{1F3DB}\u{FE0F}',
  fire_station: '\u{1F692}',
  high_ground: '\u{26F0}\u{FE0F}',
  police: '\u{1F6A8}',
};

const POINT_TYPES = ['all', 'hospital', 'shelter', 'fire_station', 'high_ground', 'police'] as const;

function getGoogleMapsUrl(lat: number, lon: number, destLat: number, destLon: number) {
  return `https://www.google.com/maps/dir/${lat},${lon}/${destLat},${destLon}`;
}

function RouteCard({ route, userLat, userLon, t }: {
  route: EvacuationRoute;
  userLat: number;
  userLon: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const sp = route.safe_point;
  const icon = POINT_TYPE_ICONS[sp.type] || '\u{1F4CD}';
  const typeKey = sp.type === 'fire_station' ? 'fireStation'
    : sp.type === 'high_ground' ? 'highGround'
    : sp.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-heavy rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0" role="img" aria-label={typeKey}>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary truncate">
              {sp.name}
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
              {t(typeKey)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-accent-green">
            {t('distance', { km: route.distance_km })}
          </p>
          <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted">
            {t('bearing', { dir: route.bearing })}
          </p>
        </div>
      </div>

      {sp.address && (
        <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary truncate">
          {sp.address}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="font-[family-name:var(--font-sans)] text-xs text-text-muted">
          {t('walkingTime', { min: route.estimated_time_min })}
        </span>

        <div className="flex gap-2">
          {sp.phone && (
            <a
              href={`tel:${sp.phone}`}
              className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
            >
              {t('call')}
            </a>
          )}
          <a
            href={getGoogleMapsUrl(userLat, userLon, sp.latitude, sp.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green text-xs font-medium hover:bg-accent-green/25 transition-colors"
          >
            {t('navigate')}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function EvacuationPage() {
  const t = useTranslations('Evacuation');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const geo = useGeolocation();
  const [filterType, setFilterType] = useState<string>('all');

  const typeParam = filterType === 'all' ? null : filterType;

  const { routes, isLoading, error } = useEvacuationRoutes(
    geo.latitude,
    geo.longitude,
    null,
    typeParam,
    10,
  );

  // Province-based fallback when GPS is unavailable
  const needsFallback = !geo.isLoading && geo.latitude == null;
  const { points: fallbackPoints, isLoading: fallbackLoading } = useSafePoints(
    needsFallback ? provinceCode : null,
    needsFallback,
  );

  const filteredRoutes = useMemo(() => {
    if (filterType === 'all') return routes;
    return routes.filter((r) => r.safe_point.type === filterType);
  }, [routes, filterType]);

  if (geo.isLoading) {
    return (
      <PageTransition transitionKey="evacuation">
        <div className="h-full flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition transitionKey="evacuation">
      <div className="h-full overflow-y-auto pt-20 pb-6 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-1 font-[family-name:var(--font-sans)] text-sm text-text-secondary">
            {t('subtitle')}
          </p>
          {error && (
            <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Location prompt with enable button */}
        {geo.error && (
          <div className="glass-heavy rounded-2xl p-5 mb-4 border border-amber-500/20 text-center">
            <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary mb-3">
              {t('useLocation')}
            </p>
            {geo.error.toLowerCase().includes('denied') || geo.error.toLowerCase().includes('permission') ? (
              <p className="font-[family-name:var(--font-sans)] text-xs text-amber-400 mt-2">
                {t('locationDenied')}
              </p>
            ) : (
              <button
                type="button"
                onClick={geo.requestPermission}
                className="px-5 py-2.5 rounded-xl bg-accent-green text-bg-primary font-[family-name:var(--font-display)] font-semibold text-sm hover:bg-accent-green/90 transition-colors"
              >
                {t('enableLocation')}
              </button>
            )}
          </div>
        )}

        {/* Type filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
          {POINT_TYPES.map((pt) => {
            const label = pt === 'all'
              ? t('allTypes')
              : pt === 'fire_station'
              ? t('fireStation')
              : pt === 'high_ground'
              ? t('highGround')
              : t(pt);
            return (
              <button
                key={pt}
                type="button"
                onClick={() => setFilterType(pt)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer',
                  filterType === pt
                    ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                    : 'glass-heavy text-text-muted hover:text-text-secondary border border-transparent',
                ].join(' ')}
              >
                {pt !== 'all' && (
                  <span className="mr-1">{POINT_TYPE_ICONS[pt]}</span>
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Routes list */}
        {isLoading || fallbackLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted uppercase tracking-wider">
              {t('nearest')}
            </p>
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.safe_point.id}
                route={route}
                userLat={geo.latitude ?? 39.47}
                userLon={geo.longitude ?? -0.376}
                t={t}
              />
            ))}
          </div>
        ) : needsFallback && fallbackPoints.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted uppercase tracking-wider">
              {t('provincePoints')}
            </p>
            {fallbackPoints
              .filter((p) => filterType === 'all' || p.type === filterType)
              .map((sp) => (
                <div key={sp.id} className="glass-heavy rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-xl">{POINT_TYPE_ICONS[sp.type] || '\u{1F4CD}'}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary truncate">
                      {sp.name}
                    </h3>
                    {sp.address && (
                      <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary truncate">{sp.address}</p>
                    )}
                  </div>
                  {sp.phone && (
                    <a href={`tel:${sp.phone}`} className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium">
                      {t('call')}
                    </a>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="glass-heavy rounded-2xl p-8 text-center">
            <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">
              {t('noPoints')}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
