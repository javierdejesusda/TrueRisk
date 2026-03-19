'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { getContacts } from '@/lib/constants/emergency-contacts';
import { QuickCall } from '@/components/emergency/quick-call';
import { FirstAidCards } from '@/components/emergency/first-aid';
import { AdvisorPanel } from '@/components/emergency/advisor-panel';

const CONTACT_LABELS: Record<string, string> = {
  proteccionCivil: 'Proteccion Civil',
  bomberos: 'Bomberos',
  policiaLocal: 'Policia Local',
  hospital: 'Hospital',
};

const PROVINCE_NAMES: Record<string, string> = {
  '01': 'Alava', '02': 'Albacete', '03': 'Alicante', '04': 'Almeria',
  '05': 'Avila', '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona',
  '09': 'Burgos', '10': 'Caceres', '11': 'Cadiz', '12': 'Castellon',
  '13': 'Ciudad Real', '14': 'Cordoba', '15': 'A Coruna', '16': 'Cuenca',
  '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaen', '24': 'Leon',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
  '29': 'Malaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
  '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
  '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel',
  '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia',
  '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla',
};

const sortedProvinces = Object.entries(PROVINCE_NAMES).sort((a, b) => a[1].localeCompare(b[1]));

export default function EmergencyPage() {
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const contacts = getContacts(provinceCode);
  const hasContacts = Object.keys(contacts).length > 0;
  const provinceName = PROVINCE_NAMES[provinceCode] || provinceCode;

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <motion.div
        className="mx-auto max-w-2xl px-4 py-20 pb-24 space-y-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Main 112 button */}
        <section className="text-center space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-text-primary">Emergencias</h1>
          <a
            href="tel:112"
            aria-label="Llamar al 112"
            className="mx-auto flex items-center justify-center gap-3 bg-gradient-to-br from-red-600 to-red-700 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] active:bg-red-800 text-white font-bold text-2xl rounded-2xl h-20 w-full max-w-xs transition-all shadow-lg shadow-red-900/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Llamar 112
          </a>
          <p className="font-[family-name:var(--font-mono)] text-xs text-text-muted">Numero de emergencias de Espana - gratuito 24h</p>
        </section>

        {/* Province selector */}
        <section className="space-y-2">
          <label htmlFor="province-select" className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary">
            Tu provincia
          </label>
          <select
            id="province-select"
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
            className="w-full glass-heavy rounded-xl font-[family-name:var(--font-sans)] px-4 py-3 text-sm text-text-primary appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            {sortedProvinces.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </section>

        {/* Province-specific contacts */}
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-primary">
            Contactos de emergencia — {provinceName}
          </h2>
          {hasContacts ? (
            <div className="grid gap-2">
              {(Object.entries(contacts) as [string, string][]).map(([key, number]) => (
                <a
                  key={key}
                  href={`tel:${number.replace(/\s/g, '')}`}
                  aria-label={`Llamar a ${CONTACT_LABELS[key] || key}: ${number}`}
                  className="flex items-center justify-between glass rounded-xl px-4 py-3 hover:bg-white/10 transition-colors"
                >
                  <span className="font-[family-name:var(--font-sans)] text-sm text-text-secondary">{CONTACT_LABELS[key] || key}</span>
                  <span className="font-[family-name:var(--font-mono)] text-base font-bold text-text-primary">{number}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted bg-white/5 border border-white/10 rounded-xl p-4">
              No hay contactos especificos para esta provincia. Usa el 112 para cualquier emergencia.
            </p>
          )}
        </section>

        {/* Emergency Guidance */}
        <section className="space-y-3">
          <AdvisorPanel />
        </section>

        {/* First aid cards */}
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-primary">Guia de primeros auxilios</h2>
          <FirstAidCards />
        </section>
      </motion.div>

      <QuickCall floating />
    </div>
  );
}
