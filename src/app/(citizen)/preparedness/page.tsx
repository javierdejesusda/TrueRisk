'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePreparedness } from '@/hooks/use-preparedness';
import { useAppStore } from '@/store/app-store';
import { ScoreGauge } from '@/components/preparedness/score-gauge';
import { ScoreTrend } from '@/components/preparedness/score-trend';
import { CategoryCard } from '@/components/preparedness/category-card';

const CATEGORY_CTAS: Record<string, { href: string }> = {
  plan: { href: '/preparedness/plan' },
  alerts: { href: '/profile' },
};

const FALLBACK_CATEGORIES = [
  {
    category: 'kit',
    items: [
      { item_key: 'water_supply', label: 'Water supply (3 days)', label_es: 'Suministro de agua (3 dias)', description: 'Store at least 3 liters per person per day', desc_es: 'Almacenar al menos 3 litros por persona al dia', priority: 'high' },
      { item_key: 'non_perishable_food', label: 'Non-perishable food (3 days)', label_es: 'Comida no perecedera (3 dias)', description: 'Canned goods, energy bars, dried fruit', desc_es: 'Conservas, barritas energeticas, fruta seca', priority: 'high' },
      { item_key: 'first_aid_kit', label: 'First aid kit', label_es: 'Botiquin de primeros auxilios', description: 'Bandages, antiseptic, pain relievers', desc_es: 'Vendas, antiseptico, analgesicos', priority: 'high' },
      { item_key: 'flashlight_batteries', label: 'Flashlight and batteries', label_es: 'Linterna y pilas', description: 'LED flashlight with extra batteries', desc_es: 'Linterna LED con pilas extra', priority: 'normal' },
      { item_key: 'portable_radio', label: 'Portable radio', label_es: 'Radio portatil', description: 'Battery-powered radio for emergency broadcasts', desc_es: 'Radio a pilas para emisiones de emergencia', priority: 'normal' },
      { item_key: 'phone_charger', label: 'Phone charger / power bank', label_es: 'Cargador / bateria externa', description: 'Keep a fully charged portable power bank', desc_es: 'Mantener una bateria externa cargada', priority: 'high' },
      { item_key: 'important_documents', label: 'Document copies', label_es: 'Copias de documentos', description: 'Copies of ID, insurance in waterproof bag', desc_es: 'Copias de DNI, seguro en bolsa impermeable', priority: 'normal' },
      { item_key: 'cash_reserve', label: 'Cash reserve', label_es: 'Reserva de efectivo', description: 'Small bills in case ATMs are down', desc_es: 'Billetes pequenos por si cajeros no funcionan', priority: 'normal' },
      { item_key: 'whistle', label: 'Emergency whistle', label_es: 'Silbato de emergencia', description: 'To signal for help if trapped', desc_es: 'Para pedir ayuda si queda atrapado', priority: 'normal' },
      { item_key: 'multi_tool', label: 'Multi-tool / knife', label_es: 'Multiherramienta / cuchillo', description: 'A basic multi-tool for emergencies', desc_es: 'Multiherramienta basica para emergencias', priority: 'normal' },
    ],
  },
  {
    category: 'plan',
    items: [
      { item_key: 'emergency_contact', label: 'Emergency contact set', label_es: 'Contacto de emergencia configurado', description: 'Set your emergency contact in profile', desc_es: 'Configura tu contacto de emergencia', priority: 'high' },
      { item_key: 'meeting_point', label: 'Family meeting point', label_es: 'Punto de encuentro familiar', description: 'Agree on a meeting point outside home', desc_es: 'Acordar un punto de encuentro fuera de casa', priority: 'high' },
      { item_key: 'evacuation_route', label: 'Know evacuation routes', label_es: 'Conocer rutas de evacuacion', description: 'Identify at least 2 routes from home', desc_es: 'Identificar al menos 2 rutas desde casa', priority: 'high' },
      { item_key: 'household_plan', label: 'Household emergency plan', label_es: 'Plan de emergencia del hogar', description: 'Create your plan using the plan builder', desc_es: 'Crear tu plan de emergencia', priority: 'high' },
      { item_key: 'utility_shutoff', label: 'Know utility shut-offs', label_es: 'Conocer llaves de corte', description: 'Know where to turn off gas, water, electricity', desc_es: 'Saber donde cortar gas, agua y electricidad', priority: 'normal' },
      { item_key: 'insurance_review', label: 'Review insurance coverage', label_es: 'Revisar cobertura del seguro', description: 'Ensure home insurance covers disasters', desc_es: 'Asegurar que seguro cubre desastres', priority: 'normal' },
    ],
  },
  {
    category: 'alerts',
    items: [
      { item_key: 'severity_configured', label: 'Alert severity configured', label_es: 'Severidad de alertas configurada', description: 'Set your alert severity threshold', desc_es: 'Configura tu umbral de severidad', priority: 'high' },
      { item_key: 'hazard_preferences', label: 'Hazard preferences set', label_es: 'Preferencias de peligros configuradas', description: 'Choose hazard types for alerts', desc_es: 'Elige tipos de peligro para alertas', priority: 'normal' },
      { item_key: 'push_enabled', label: 'Push notifications enabled', label_es: 'Notificaciones push activadas', description: 'Enable push notifications for alerts', desc_es: 'Activar notificaciones push para alertas', priority: 'high' },
      { item_key: 'quiet_hours_set', label: 'Quiet hours configured', label_es: 'Horas de silencio configuradas', description: 'Set quiet hours for non-critical alerts', desc_es: 'Configurar horas de silencio', priority: 'normal' },
    ],
  },
  {
    category: 'community',
    items: [
      { item_key: 'first_report', label: 'Submit first hazard report', label_es: 'Enviar primer reporte de peligro', description: 'Report a local hazard observation', desc_es: 'Reporta una observacion de peligro local', priority: 'normal' },
      { item_key: 'upvote_report', label: 'Verify a community report', label_es: 'Verificar un reporte comunitario', description: 'Upvote a report to confirm observation', desc_es: 'Vota un reporte para confirmar', priority: 'normal' },
    ],
  },
  {
    category: 'knowledge',
    items: [
      { item_key: 'risk_dashboard_viewed', label: 'Explore your risk dashboard', label_es: 'Explorar tu panel de riesgos', description: 'View your province risk scores', desc_es: 'Ver puntuaciones de riesgo', priority: 'normal' },
      { item_key: 'prediction_models_viewed', label: 'Review ML prediction models', label_es: 'Revisar modelos de prediccion ML', description: 'Understand how TrueRisk predicts hazards', desc_es: 'Entender como predice peligros', priority: 'normal' },
      { item_key: 'emergency_page_viewed', label: 'Read emergency guidance', label_es: 'Leer orientacion de emergencia', description: 'Read emergency page and first aid info', desc_es: 'Leer informacion de primeros auxilios', priority: 'normal' },
      { item_key: 'map_explored', label: 'Explore the risk map', label_es: 'Explorar el mapa de riesgos', description: 'Navigate the interactive map', desc_es: 'Navegar el mapa interactivo', priority: 'normal' },
    ],
  },
];

const CATEGORY_LABELS: Record<string, { en: string; es: string }> = {
  kit: { en: 'Emergency Kit', es: 'Kit de Emergencia' },
  plan: { en: 'Emergency Plan', es: 'Plan de Emergencia' },
  alerts: { en: 'Alert Configuration', es: 'Configuracion de Alertas' },
  community: { en: 'Community Engagement', es: 'Participacion Comunitaria' },
  knowledge: { en: 'Knowledge & Training', es: 'Conocimiento y Formacion' },
};

export default function PreparednessPage() {
  const t = useTranslations('Preparedness');
  const locale = useAppStore((s) => s.locale);
  const { score, checklist, history, isLoading, error, toggleItem, refresh } = usePreparedness();
  const isEs = locale === 'es';

  const categories = score?.categories ?? [];
  const hasData = categories.length > 0;

  return (
    <motion.div
      className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-4xl mx-auto overflow-y-auto"
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

      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        </div>
      )}

      {error && !hasData && (
        <div className="glass-heavy rounded-2xl p-5 mb-6 border border-accent-orange/30">
          <p className="text-sm text-accent-orange mb-3">{error}</p>
          <button
            onClick={refresh}
            className="text-xs font-medium text-white bg-accent-orange/20 hover:bg-accent-orange/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <ScoreGauge
              score={score?.total_score ?? 0}
              isLoading={isLoading}
              label={t('scoreLabel')}
            />
            <ScoreTrend
              history={history}
              label={t('trendLabel')}
            />
          </div>

          <div className="flex flex-col gap-3">
            {categories.map((cat) => {
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
                  cta={cta ? { label: isEs ? (cat.category === 'plan' ? 'Crear tu plan' : 'Configurar alertas') : (cat.category === 'plan' ? 'Build your plan' : 'Configure alerts'), href: cta.href } : undefined}
                />
              );
            })}
          </div>
        </>
      )}

      {!isLoading && !hasData && (
        <div className="flex flex-col gap-3">
          {FALLBACK_CATEGORIES.map((cat) => {
            const label = CATEGORY_LABELS[cat.category];
            const items = cat.items.map((item) => ({
              item_key: item.item_key,
              label: isEs ? item.label_es : item.label,
              description: isEs ? item.desc_es : item.description,
              category: cat.category,
              completed: false,
              completed_at: null,
              priority: item.priority,
            }));

            return (
              <CategoryCard
                key={cat.category}
                category={cat.category}
                label={label ? (isEs ? label.es : label.en) : cat.category}
                totalItems={items.length}
                completedItems={0}
                score={0}
                items={items}
                onToggle={toggleItem}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
