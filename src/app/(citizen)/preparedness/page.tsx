'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePreparedness } from '@/hooks/use-preparedness';
import { useAppStore } from '@/store/app-store';
import { ScoreGauge } from '@/components/preparedness/score-gauge';
import { ScoreTrend } from '@/components/preparedness/score-trend';
import { CategoryCard } from '@/components/preparedness/category-card';
import { StreakWidget } from '@/components/preparedness/streak-widget';
import { BadgesPanel } from '@/components/preparedness/badges-panel';
import { useGamification } from '@/hooks/use-gamification';
import type { ChecklistItem } from '@/hooks/use-preparedness';

const CATEGORY_CTAS: Record<string, { href: string }> = {
  plan: { href: '/preparedness/plan' },
  alerts: { href: '/profile' },
};

const FALLBACK_ITEMS: Record<string, Array<{ key: string; en: string; es: string; desc_en: string; desc_es: string; priority: string }>> = {
  kit: [
    { key: 'water_supply', en: 'Water supply (3 days)', es: 'Suministro de agua (3 dias)', desc_en: 'Store at least 3 liters per person per day', desc_es: 'Almacenar al menos 3 litros por persona al dia', priority: 'high' },
    { key: 'non_perishable_food', en: 'Non-perishable food (3 days)', es: 'Comida no perecedera (3 dias)', desc_en: 'Canned goods, energy bars, dried fruit', desc_es: 'Conservas, barritas energeticas, fruta seca', priority: 'high' },
    { key: 'first_aid_kit', en: 'First aid kit', es: 'Botiquin de primeros auxilios', desc_en: 'Bandages, antiseptic, pain relievers', desc_es: 'Vendas, antiseptico, analgesicos', priority: 'high' },
    { key: 'flashlight_batteries', en: 'Flashlight and batteries', es: 'Linterna y pilas', desc_en: 'LED flashlight with extra batteries', desc_es: 'Linterna LED con pilas extra', priority: 'normal' },
    { key: 'portable_radio', en: 'Portable radio', es: 'Radio portatil', desc_en: 'Battery-powered radio for emergencies', desc_es: 'Radio a pilas para emergencias', priority: 'normal' },
    { key: 'phone_charger', en: 'Phone charger / power bank', es: 'Cargador / bateria externa', desc_en: 'Keep a charged portable power bank', desc_es: 'Mantener bateria externa cargada', priority: 'high' },
    { key: 'important_documents', en: 'Document copies', es: 'Copias de documentos', desc_en: 'ID, insurance in waterproof bag', desc_es: 'DNI, seguro en bolsa impermeable', priority: 'normal' },
    { key: 'cash_reserve', en: 'Cash reserve', es: 'Reserva de efectivo', desc_en: 'Small bills in case ATMs are down', desc_es: 'Billetes pequenos por si cajeros fallan', priority: 'normal' },
    { key: 'whistle', en: 'Emergency whistle', es: 'Silbato de emergencia', desc_en: 'To signal for help if trapped', desc_es: 'Para pedir ayuda si queda atrapado', priority: 'normal' },
    { key: 'multi_tool', en: 'Multi-tool / knife', es: 'Multiherramienta', desc_en: 'A basic multi-tool for emergencies', desc_es: 'Multiherramienta basica', priority: 'normal' },
  ],
  plan: [
    { key: 'emergency_contact', en: 'Emergency contact set', es: 'Contacto de emergencia', desc_en: 'Set emergency contact in profile', desc_es: 'Configura contacto de emergencia', priority: 'high' },
    { key: 'meeting_point', en: 'Family meeting point', es: 'Punto de encuentro familiar', desc_en: 'Agree on a meeting point', desc_es: 'Acordar un punto de encuentro', priority: 'high' },
    { key: 'evacuation_route', en: 'Know evacuation routes', es: 'Rutas de evacuacion', desc_en: 'Identify at least 2 routes from home', desc_es: 'Identificar al menos 2 rutas', priority: 'high' },
    { key: 'household_plan', en: 'Household emergency plan', es: 'Plan de emergencia del hogar', desc_en: 'Create your emergency plan', desc_es: 'Crear tu plan de emergencia', priority: 'high' },
    { key: 'utility_shutoff', en: 'Know utility shut-offs', es: 'Llaves de corte', desc_en: 'Gas, water, electricity shutoffs', desc_es: 'Saber cortar gas, agua, electricidad', priority: 'normal' },
    { key: 'insurance_review', en: 'Review insurance', es: 'Revisar seguro', desc_en: 'Ensure coverage for disasters', desc_es: 'Asegurar cobertura para desastres', priority: 'normal' },
  ],
  alerts: [
    { key: 'severity_configured', en: 'Alert severity configured', es: 'Severidad configurada', desc_en: 'Set alert severity threshold', desc_es: 'Configura umbral de severidad', priority: 'high' },
    { key: 'hazard_preferences', en: 'Hazard preferences set', es: 'Preferencias de peligros', desc_en: 'Choose hazard types for alerts', desc_es: 'Elige tipos de peligro', priority: 'normal' },
    { key: 'push_enabled', en: 'Push notifications', es: 'Notificaciones push', desc_en: 'Enable push for real-time alerts', desc_es: 'Activar push para alertas', priority: 'high' },
    { key: 'quiet_hours_set', en: 'Quiet hours', es: 'Horas de silencio', desc_en: 'Set quiet hours for night', desc_es: 'Configurar horas de silencio', priority: 'normal' },
  ],
  community: [
    { key: 'first_report', en: 'Submit first report', es: 'Enviar primer reporte', desc_en: 'Report a local hazard', desc_es: 'Reporta un peligro local', priority: 'normal' },
    { key: 'upvote_report', en: 'Verify a report', es: 'Verificar un reporte', desc_en: 'Confirm a community report', desc_es: 'Confirmar un reporte comunitario', priority: 'normal' },
  ],
  knowledge: [
    { key: 'risk_dashboard_viewed', en: 'Explore risk dashboard', es: 'Explorar panel de riesgos', desc_en: 'View your province risk scores', desc_es: 'Ver puntuaciones de riesgo', priority: 'normal' },
    { key: 'prediction_models_viewed', en: 'Review ML models', es: 'Revisar modelos ML', desc_en: 'Understand hazard predictions', desc_es: 'Entender predicciones', priority: 'normal' },
    { key: 'emergency_page_viewed', en: 'Read emergency guidance', es: 'Leer guia de emergencia', desc_en: 'Read emergency and first aid info', desc_es: 'Leer informacion de emergencia', priority: 'normal' },
    { key: 'map_explored', en: 'Explore the risk map', es: 'Explorar mapa de riesgos', desc_en: 'Navigate the interactive map', desc_es: 'Navegar el mapa interactivo', priority: 'normal' },
  ],
};

const CATEGORY_LABELS: Record<string, { en: string; es: string }> = {
  kit: { en: 'Emergency Kit', es: 'Kit de Emergencia' },
  plan: { en: 'Emergency Plan', es: 'Plan de Emergencia' },
  alerts: { en: 'Alert Configuration', es: 'Configuracion de Alertas' },
  community: { en: 'Community Engagement', es: 'Participacion Comunitaria' },
  knowledge: { en: 'Knowledge & Training', es: 'Conocimiento y Formacion' },
};

const CATEGORY_ORDER = ['kit', 'plan', 'alerts', 'community', 'knowledge'];

function buildFallbackItems(category: string, isEs: boolean, completions: Record<string, boolean>): ChecklistItem[] {
  const items = FALLBACK_ITEMS[category] ?? [];
  return items.map((item) => ({
    item_key: item.key,
    label: isEs ? item.es : item.en,
    description: isEs ? item.desc_es : item.desc_en,
    category,
    completed: completions[item.key] ?? false,
    completed_at: null,
    priority: item.priority,
  }));
}

export default function PreparednessPage() {
  const t = useTranslations('Preparedness');
  const locale = useAppStore((s) => s.locale);
  const { score, checklist, history, isLoading, error, toggleItem, refresh, localCompletions } = usePreparedness();
  const { status: gamification, isLoading: gamificationLoading } = useGamification();
  const isEs = locale === 'es';

  const categories = score?.categories ?? [];
  const hasData = categories.length > 0;

  // Compute fallback score from local completions
  const totalFallbackItems = Object.values(FALLBACK_ITEMS).flat().length;
  const completedFallbackItems = Object.keys(localCompletions).length;
  const fallbackScore = totalFallbackItems > 0 ? Math.round((completedFallbackItems / totalFallbackItems) * 100) : 0;

  const ctaLabel = (cat: string) => {
    if (cat === 'plan') return isEs ? 'Crear tu plan' : 'Build your plan';
    if (cat === 'alerts') return isEs ? 'Configurar alertas' : 'Configure alerts';
    return undefined;
  };

  return (
    <motion.div
      className="h-full pt-20 px-6 lg:px-12 pb-12 max-w-4xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
          {t('title')}
        </h1>
        <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Score + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ScoreGauge
          score={score?.total_score ?? fallbackScore}
          isLoading={isLoading}
          label={t('scoreLabel')}
        />
        <ScoreTrend
          history={history}
          label={t('trendLabel')}
        />
      </div>

      {/* Gamification — streak + badges */}
      <div className="flex flex-col gap-4 mb-6">
        <StreakWidget
          totalPoints={gamification?.total_points ?? 0}
          currentStreak={gamification?.current_streak_days ?? 0}
          longestStreak={gamification?.longest_streak_days ?? 0}
          isLoading={gamificationLoading}
        />
        <BadgesPanel
          badges={gamification?.badges ?? []}
          isLoading={gamificationLoading}
        />
      </div>

      {/* Error banner (small, non-blocking) */}
      {error && (
        <div className="glass rounded-xl p-3 mb-4 border border-accent-orange/20 flex items-center justify-between">
          <p className="text-xs text-accent-orange">{error}</p>
          <button
            onClick={refresh}
            className="text-xs font-medium text-accent-orange hover:text-white px-2 py-1 rounded-lg hover:bg-accent-orange/20 transition-colors cursor-pointer shrink-0 ml-3"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        </div>
      )}

      {/* Category cards -- real data or fallback, ALWAYS shown */}
      {!isLoading && (
        <div className="flex flex-col gap-3">
          {hasData ? (
            categories.map((cat) => {
              const items = checklist?.categories[cat.category] ?? [];
              const cta = CATEGORY_CTAS[cat.category];
              return (
                <CategoryCard
                  key={cat.category}
                  category={cat.category}
                  label={cat.label}
                  totalItems={cat.total_items}
                  completedItems={cat.completed_items}
                  score={cat.score}
                  items={items}
                  onToggle={toggleItem}
                  cta={cta ? { label: ctaLabel(cat.category) ?? '', href: cta.href } : undefined}
                />
              );
            })
          ) : (
            CATEGORY_ORDER.map((catKey) => {
              const label = CATEGORY_LABELS[catKey];
              const items = buildFallbackItems(catKey, isEs, localCompletions);
              const cta = CATEGORY_CTAS[catKey];
              const completedCount = items.filter((i) => i.completed).length;
              return (
                <CategoryCard
                  key={catKey}
                  category={catKey}
                  label={label ? (isEs ? label.es : label.en) : catKey}
                  totalItems={items.length}
                  completedItems={completedCount}
                  score={items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0}
                  items={items}
                  onToggle={toggleItem}
                  cta={cta ? { label: ctaLabel(catKey) ?? '', href: cta.href } : undefined}
                />
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}
