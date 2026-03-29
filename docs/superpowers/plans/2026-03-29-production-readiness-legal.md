# Production Readiness — Legal & Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GDPR-compliant legal pages, cookie banner, and enhanced footer to make TrueRisk production-ready.

**Architecture:** 6 new legal pages under a `(legal)` route group with a minimal layout (no auth, no NavPill). A `CookieBanner` component mounted in the root layout. The existing landing `Footer` enhanced with legal links. All text in `messages/en.json` and `messages/es.json` under a `Legal` namespace.

**Tech Stack:** Next.js 16 App Router, next-intl, Framer Motion, Tailwind CSS v4, Lucide React icons

**Spec:** `docs/superpowers/specs/2026-03-29-production-readiness-legal-design.md`

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `src/app/(legal)/layout.tsx` | Minimal legal layout with header/footer, no auth |
| `src/app/(legal)/privacy/page.tsx` | GDPR privacy policy page |
| `src/app/(legal)/terms/page.tsx` | Terms of use page |
| `src/app/(legal)/cookies/page.tsx` | Cookie policy page |
| `src/app/(legal)/license/page.tsx` | MIT license + open source info |
| `src/app/(legal)/about/page.tsx` | About, credits, third-party attribution |
| `src/app/(legal)/accessibility/page.tsx` | Accessibility statement |
| `src/components/legal/cookie-banner.tsx` | Informational cookie banner (root layout) |
| `src/components/legal/legal-page-shell.tsx` | Shared wrapper for all legal pages |

### Modified Files
| File | Change |
|------|--------|
| `messages/en.json` | Add `Legal` namespace with all page content |
| `messages/es.json` | Add `Legal` namespace with all page content (Spanish) |
| `src/app/layout.tsx` | Mount `CookieBanner` component |
| `src/components/landing/footer.tsx` | Add legal links row |

---

## Task 1: Add Legal i18n Strings (EN)

**Files:**
- Modify: `messages/en.json`

This task adds ALL English i18n strings for the entire legal feature. All subsequent tasks depend on these strings existing.

- [ ] **Step 1: Add Legal namespace to en.json**

Add the following after the closing `}` of the `"Phrases"` namespace (before the final `}`). The `Legal` key is a sibling of `Common`, `Nav`, etc.

```json
"Legal": {
  "cookieBanner": {
    "message": "This site uses essential cookies for authentication and language preferences. No tracking or analytics cookies are used.",
    "learnMore": "Learn more",
    "dismiss": "Got it"
  },
  "footer": {
    "privacy": "Privacy Policy",
    "terms": "Terms of Use",
    "cookies": "Cookie Policy",
    "license": "License",
    "about": "About",
    "accessibility": "Accessibility"
  },
  "backToHome": "Back to home",
  "lastUpdated": "Last updated: {date}",
  "tableOfContents": "On this page",
  "privacy": {
    "title": "Privacy Policy",
    "intro": "TrueRisk is an open-source community project committed to protecting your privacy. This policy explains what data we collect, why, and how we protect it.",
    "dataController": {
      "title": "Data Controller",
      "content": "TrueRisk is an open-source community project hosted on GitHub. As there is no formal legal entity behind the project, the project maintainers act as data controllers. For any data-related inquiries, please open an issue on our GitHub repository or contact us via the details at the bottom of this page."
    },
    "dataWeCollect": {
      "title": "Data We Collect",
      "intro": "We collect different categories of data depending on how you use the platform:",
      "identity": {
        "title": "Identity & Authentication",
        "content": "Email address, nickname, display name, avatar URL, and authentication provider (Google, GitHub, or credentials). Your email is encrypted at rest."
      },
      "location": {
        "title": "Location Data",
        "content": "Home and work addresses (encrypted at rest), geographic coordinates, province preferences, and — if you grant permission — real-time GPS location for emergency features."
      },
      "health": {
        "title": "Health & Medical",
        "content": "Medical conditions (encrypted at rest), mobility level, age range, and whether you depend on power for medical equipment. This data is used solely to personalise emergency guidance."
      },
      "emergency": {
        "title": "Emergency Contacts",
        "content": "Emergency contact names and phone numbers (both encrypted at rest). Used for the family safety check-in feature."
      },
      "household": {
        "title": "Household Information",
        "content": "Household member details, pet information, and special needs. Used to generate personalised preparedness plans and emergency guidance."
      },
      "building": {
        "title": "Building Details",
        "content": "Construction year, building materials, number of stories, floor level, and building condition. Used to assess vulnerability to natural hazards."
      },
      "economic": {
        "title": "Economic Vulnerability",
        "content": "Income bracket, insurance status, property value range, and emergency savings. Used to tailor preparedness recommendations to your situation."
      },
      "safety": {
        "title": "Safety Check-ins",
        "content": "Your safety status during emergencies (safe, need help, evacuating, sheltering), optional location and messages. Shared with your linked family members."
      },
      "family": {
        "title": "Family Links",
        "content": "Connections to other users you designate as family, friends, or neighbours. Used for mutual safety check-ins during emergencies."
      },
      "community": {
        "title": "Community Reports",
        "content": "Hazard reports you submit including type, severity, location, description, and optional photos. These are visible to other users in the affected area."
      },
      "preparedness": {
        "title": "Preparedness Data",
        "content": "Checklist completion status, emergency plans (including meeting points, communication plans, insurance information, and document locations), and preparedness scores over time."
      },
      "notifications": {
        "title": "Notification Preferences",
        "content": "Push notification endpoints, phone numbers for SMS alerts, Telegram chat IDs, and your alert delivery preferences (channels, severity thresholds, quiet hours)."
      }
    },
    "legalBasis": {
      "title": "Legal Basis for Processing",
      "intro": "Under GDPR Article 6, we process your data on the following bases:",
      "consent": "Consent — You choose to create an account and provide optional profile information. You can withdraw consent at any time by deleting your account.",
      "contract": "Contract performance — Processing necessary to provide the service you registered for (risk alerts, emergency guidance, preparedness tools).",
      "legitimate": "Legitimate interest — Security measures, abuse prevention, and service improvement.",
      "vital": "Vital interests — Emergency safety features (safety check-ins, family status) where processing may be necessary to protect life."
    },
    "howWeUse": {
      "title": "How We Use Your Data",
      "content": "Your data is used to: calculate personalised risk scores for your location, send relevant hazard alerts, generate emergency guidance tailored to your profile (health, mobility, household), enable family safety coordination during emergencies, track your preparedness progress, and facilitate community hazard reporting."
    },
    "storage": {
      "title": "Data Storage & Encryption",
      "content": "Your data is stored on servers located in the European Union (Cubepath hosting infrastructure). Sensitive fields — including email addresses, home and work addresses, medical conditions, emergency contact names, and phone numbers — are encrypted at rest using Fernet symmetric encryption. Passwords are hashed and never stored in plain text."
    },
    "retention": {
      "title": "Data Retention",
      "content": "Account data is retained for as long as your account exists. Property risk reports expire automatically after 30 days. Safety check-ins expire after their configured duration. You can delete your entire account and all associated data at any time through the profile settings."
    },
    "thirdParty": {
      "title": "Third-Party Services",
      "intro": "TrueRisk integrates with the following external services:",
      "google": "Google OAuth — Authentication provider. Subject to Google's Privacy Policy.",
      "github": "GitHub OAuth — Authentication provider. Subject to GitHub's Privacy Policy.",
      "openmeteo": "Open-Meteo — Open-source weather API. Receives province-level location data (not personal data) to fetch weather information.",
      "aemet": "AEMET (Spanish State Meteorological Agency) — Official weather and alert data. No personal data is shared.",
      "maplibre": "OpenFreeMap / MapLibre — Map tile rendering. Your browser requests map tiles directly; IP address is visible to the tile server.",
      "nominatim": "Nominatim / OpenStreetMap — Geocoding service. Addresses are sent to resolve coordinates. Subject to OpenStreetMap's privacy policy."
    },
    "transfers": {
      "title": "International Data Transfers",
      "content": "Your core data is stored within the EU. However, if you authenticate via Google or GitHub, those providers may process authentication data outside the EU under their own GDPR-compliant data processing agreements."
    },
    "rights": {
      "title": "Your Rights",
      "intro": "Under GDPR, you have the following rights:",
      "access": "Right of access — Request a copy of all data we hold about you.",
      "rectification": "Right to rectification — Correct inaccurate data through your profile settings or by contacting us.",
      "erasure": "Right to erasure — Delete your account and all associated data at any time via profile settings.",
      "portability": "Right to data portability — Request your data in a structured, machine-readable format.",
      "restriction": "Right to restriction — Request that we limit processing of your data.",
      "objection": "Right to object — Object to processing based on legitimate interest.",
      "withdraw": "Right to withdraw consent — Withdraw consent at any time without affecting prior processing."
    },
    "exerciseRights": {
      "title": "How to Exercise Your Rights",
      "content": "To exercise any of these rights, you can: delete your account directly through profile settings, open an issue on our GitHub repository, or email us at the address listed below. We will respond within 30 days as required by GDPR."
    },
    "children": {
      "title": "Children's Privacy",
      "content": "TrueRisk is not directed at children under 16 years of age. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, please contact us and we will delete it."
    },
    "changes": {
      "title": "Changes to This Policy",
      "content": "We may update this privacy policy from time to time. Changes will be posted on this page with an updated date. Continued use of TrueRisk after changes constitutes acceptance of the updated policy."
    },
    "contact": {
      "title": "Contact",
      "content": "For privacy-related inquiries, please open an issue on our GitHub repository or email us at:",
      "email": "privacy@truerisk.cloud",
      "github": "github.com/javierdejesusda/TrueRisk"
    }
  },
  "terms": {
    "title": "Terms of Use",
    "intro": "By accessing or using TrueRisk, you agree to be bound by these terms. If you do not agree, please do not use the service.",
    "acceptance": {
      "title": "Acceptance of Terms",
      "content": "These Terms of Use govern your access to and use of TrueRisk, a multi-hazard risk intelligence platform for Spain. By creating an account or using any features of the platform, you accept these terms in full."
    },
    "serviceDescription": {
      "title": "Description of Service",
      "content": "TrueRisk provides ML-powered risk scoring across 7 natural hazards (flood, wildfire, drought, heatwave, seismic, cold wave, windstorm) for all 52 Spanish provinces. Features include real-time weather monitoring, personalised emergency guidance, community hazard reporting, family safety check-ins, and preparedness planning tools."
    },
    "accounts": {
      "title": "Account Registration",
      "content": "You must provide accurate information when creating an account. You are responsible for maintaining the security of your password and account. One account per person. You must be at least 16 years old to create an account."
    },
    "acceptableUse": {
      "title": "Acceptable Use",
      "content": "You agree not to: submit false or misleading community hazard reports, use automated systems to scrape or overload the platform, impersonate other users or officials, use the platform for any unlawful purpose, or attempt to gain unauthorised access to other accounts or system infrastructure."
    },
    "riskDisclaimer": {
      "title": "Risk Information Disclaimer",
      "important": "IMPORTANT",
      "content": "Risk scores, hazard predictions, and AI-generated summaries provided by TrueRisk are for informational purposes only. They are produced by machine learning models and may contain inaccuracies or errors.",
      "notSubstitute": "TrueRisk is not a substitute for official emergency services. In any emergency, always follow the instructions of Protección Civil, AEMET, and emergency services (112). Do not rely solely on TrueRisk for life-safety decisions.",
      "noGuarantee": "We make no guarantee that the platform will be available during actual emergency events. Network conditions, server capacity, and other factors may affect availability when you need it most."
    },
    "communityContent": {
      "title": "Community Reports & User Content",
      "content": "Community hazard reports are submitted by users and are not verified by official sources. TrueRisk is not liable for the accuracy of user-submitted content. By submitting a report, you grant TrueRisk a non-exclusive license to display it to other users in the affected area. You retain ownership of your content."
    },
    "intellectualProperty": {
      "title": "Intellectual Property",
      "content": "TrueRisk is open-source software released under the MIT License. You are free to use, modify, and distribute the source code in accordance with the license terms. The TrueRisk name and logo are project trademarks used to identify this specific deployment."
    },
    "liability": {
      "title": "Limitation of Liability",
      "content": "TrueRisk is provided as an open-source community project on an \"as is\" and \"as available\" basis, without warranties of any kind, express or implied. To the maximum extent permitted by law, the project contributors shall not be liable for any damages arising from: decisions made based on risk scores or predictions, inaccurate or delayed hazard information, service unavailability during emergencies, loss of data, or any other use of the platform."
    },
    "availability": {
      "title": "Service Availability",
      "content": "TrueRisk is a community project with no Service Level Agreement (SLA). The platform may be unavailable for maintenance, updates, or due to infrastructure issues. We make best efforts to maintain uptime but provide no guarantees."
    },
    "termination": {
      "title": "Termination",
      "content": "You may delete your account at any time through profile settings, which permanently removes all your data. We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behaviour."
    },
    "governingLaw": {
      "title": "Governing Law",
      "content": "These terms are governed by the laws of Spain. Any disputes shall be submitted to the jurisdiction of the courts of Spain."
    },
    "changesToTerms": {
      "title": "Changes to These Terms",
      "content": "We may update these terms from time to time. Changes will be posted on this page with an updated date. Continued use of TrueRisk after changes constitutes acceptance of the updated terms."
    }
  },
  "cookies": {
    "title": "Cookie Policy",
    "intro": "This policy explains how TrueRisk uses cookies and similar technologies.",
    "whatAreCookies": {
      "title": "What Are Cookies",
      "content": "Cookies are small text files stored on your device by your web browser. They are used to remember preferences and enable essential functionality. Local storage is a similar browser technology that stores data locally on your device."
    },
    "cookiesWeUse": {
      "title": "Cookies We Use",
      "intro": "TrueRisk uses only essential and functional cookies:",
      "locale": {
        "name": "locale",
        "type": "Functional",
        "purpose": "Stores your language preference (Spanish or English)",
        "duration": "Persistent"
      },
      "session": {
        "name": "authjs.session-token",
        "type": "Essential",
        "purpose": "Maintains your authentication session",
        "duration": "7 days"
      },
      "secureSession": {
        "name": "__Secure-authjs.session-token",
        "type": "Essential",
        "purpose": "Secure authentication session (HTTPS only)",
        "duration": "7 days"
      }
    },
    "localStorage": {
      "title": "Local Storage",
      "intro": "TrueRisk also uses browser local storage for the following:",
      "province": {
        "name": "truerisk-province",
        "purpose": "Your app preferences including selected province, locale, map layer settings, and notification preferences"
      },
      "consent": {
        "name": "truerisk-cookie-consent",
        "purpose": "Remembers that you have seen and dismissed the cookie information banner"
      }
    },
    "noTracking": {
      "title": "No Analytics or Tracking",
      "content": "TrueRisk does not use any analytics, advertising, or tracking cookies. We do not use Google Analytics, Facebook Pixel, or any similar tracking technology. Your browsing behaviour on TrueRisk is not tracked or profiled."
    },
    "thirdPartyCookies": {
      "title": "Third-Party Cookies",
      "content": "TrueRisk does not set any third-party cookies. When you authenticate via Google or GitHub, you are redirected to their sites which may set their own cookies. These are governed by their respective cookie policies."
    },
    "managing": {
      "title": "Managing Cookies",
      "content": "You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies will prevent you from logging in to TrueRisk. Clearing local storage will reset your app preferences."
    },
    "changes": {
      "title": "Changes to This Policy",
      "content": "We may update this cookie policy from time to time. Changes will be posted on this page with an updated date."
    }
  },
  "license": {
    "title": "License",
    "intro": "TrueRisk is free and open-source software.",
    "mitTitle": "MIT License",
    "mitText": "Copyright (c) 2025-2026 TrueRisk Contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.",
    "whatThisMeans": {
      "title": "What This Means",
      "content": "The MIT License is one of the most permissive open-source licenses. You are free to:",
      "use": "Use TrueRisk for any purpose, including commercial use",
      "modify": "Modify the source code to suit your needs",
      "distribute": "Distribute copies of the original or modified code",
      "sublicense": "Include TrueRisk in proprietary software",
      "condition": "The only condition is that you include the original copyright notice and license text in any copy or substantial portion of the software."
    },
    "contributing": {
      "title": "Contributing",
      "content": "We welcome contributions from the community. To contribute, visit our GitHub repository, fork the project, and submit a pull request. All contributions are made under the same MIT License.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "thirdParty": {
      "title": "Third-Party Licenses",
      "intro": "TrueRisk is built with the following open-source technologies:",
      "items": {
        "nextjs": "Next.js — MIT License",
        "react": "React — MIT License",
        "maplibre": "MapLibre GL JS — BSD 3-Clause License",
        "fastapi": "FastAPI — MIT License",
        "tailwind": "Tailwind CSS — MIT License",
        "framer": "Framer Motion — MIT License",
        "recharts": "Recharts — MIT License",
        "zustand": "Zustand — MIT License",
        "lucide": "Lucide Icons — ISC License"
      }
    }
  },
  "about": {
    "title": "About TrueRisk",
    "mission": {
      "title": "Our Mission",
      "content": "TrueRisk aims to make natural hazard risk information accessible, understandable, and actionable for everyone in Spain. We believe that every citizen deserves real-time, personalised risk intelligence — not just raw data, but clear guidance on what to do when hazards threaten their area."
    },
    "project": {
      "title": "The Project",
      "content": "TrueRisk is an open-source community project hosted on GitHub under the MIT License. It was created to address the gap between available hazard data and citizen preparedness. The platform combines official data sources with machine learning to provide risk intelligence that was previously available only to specialised agencies."
    },
    "whatWeDo": {
      "title": "What We Do",
      "content": "TrueRisk monitors 7 natural hazards across all 52 Spanish provinces: floods, wildfires, drought, heatwaves, seismic events, cold waves, and windstorms. Each hazard has a dedicated ML model (XGBoost, LightGBM, or PyTorch) that processes real-time weather data, historical patterns, and geographic features to produce risk scores updated continuously."
    },
    "thirdParty": {
      "title": "Data Sources & Attribution",
      "intro": "TrueRisk relies on the following external services and data sources:",
      "google": {
        "name": "Google OAuth",
        "description": "Authentication provider for user login"
      },
      "github": {
        "name": "GitHub OAuth",
        "description": "Authentication provider for user login"
      },
      "openmeteo": {
        "name": "Open-Meteo",
        "description": "Open-source weather API providing real-time and forecast data"
      },
      "aemet": {
        "name": "AEMET",
        "description": "Spanish State Meteorological Agency — official weather observations, forecasts, and hazard warnings"
      },
      "openfreemap": {
        "name": "OpenFreeMap / MapLibre",
        "description": "Open-source map tile rendering and interactive map components"
      },
      "nominatim": {
        "name": "Nominatim / OpenStreetMap",
        "description": "Geocoding service for resolving addresses to coordinates"
      },
      "ine": {
        "name": "INE",
        "description": "Spanish National Statistics Institute — province and municipality demographic data"
      }
    },
    "techStack": {
      "title": "Technology Stack",
      "frontend": "Frontend: Next.js 16, React 19, Tailwind CSS v4, MapLibre GL, Framer Motion, Recharts",
      "backend": "Backend: FastAPI, SQLAlchemy (async), PostgreSQL, Alembic",
      "ml": "ML/AI: XGBoost, LightGBM, PyTorch (Temporal Fusion Transformer)",
      "infra": "Infrastructure: Docker, Dokploy, Cubepath hosting (EU)"
    },
    "contribute": {
      "title": "How to Contribute",
      "content": "TrueRisk is open to contributions of all kinds: code, documentation, translations, bug reports, and feature suggestions. Visit our GitHub repository to get started.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "contact": {
      "title": "Contact",
      "content": "For general inquiries, feature requests, or bug reports, please open an issue on our GitHub repository. For privacy-related matters, see our Privacy Policy.",
      "email": "contact@truerisk.cloud"
    }
  },
  "accessibility": {
    "title": "Accessibility Statement",
    "commitment": {
      "title": "Our Commitment",
      "content": "TrueRisk is committed to ensuring digital accessibility for all users, including people with disabilities. We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA."
    },
    "features": {
      "title": "Accessibility Features",
      "skipLink": "Skip-to-content link for keyboard users",
      "semantic": "Semantic HTML structure throughout the application",
      "keyboard": "Keyboard navigation support for all interactive elements",
      "aria": "ARIA labels and roles for dynamic content",
      "contrast": "Colour contrast ratios meeting WCAG AA standards for text",
      "responsive": "Responsive design that works at various zoom levels (up to 200%)",
      "motion": "Reduced motion support — animations respect prefers-reduced-motion",
      "focus": "Visible focus indicators on all interactive elements"
    },
    "limitations": {
      "title": "Known Limitations",
      "map": "Interactive map (MapLibre GL) — The map component has limited keyboard and screen reader support. Province selection and hazard data are also available through non-map interfaces.",
      "charts": "Data visualisations (Recharts) — Charts provide visual representation of risk data. Key data points are available in text form elsewhere in the interface.",
      "realtime": "Real-time updates — Some dynamic content (SSE alerts, live weather) may not immediately announce to screen readers."
    },
    "assistive": {
      "title": "Assistive Technology",
      "content": "TrueRisk has been developed with compatibility for screen readers, keyboard-only navigation, and browser zoom. We test with common assistive technologies and welcome feedback on accessibility issues."
    },
    "reporting": {
      "title": "Reporting Issues",
      "content": "If you encounter any accessibility barriers while using TrueRisk, please let us know. Accessibility issues are treated as high-priority bugs. You can report issues on our GitHub repository or contact us directly.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "contact": {
      "title": "Contact",
      "content": "For accessibility-related concerns:",
      "email": "accessibility@truerisk.cloud"
    }
  }
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add messages/en.json
git commit -m "feat(i18n): add Legal namespace to English translations"
```

---

## Task 2: Add Legal i18n Strings (ES)

**Files:**
- Modify: `messages/es.json`

- [ ] **Step 1: Add Legal namespace to es.json**

Add the following after the closing `}` of the `"Phrases"` namespace (before the final `}`). Same structure as en.json but fully translated to Spanish.

```json
"Legal": {
  "cookieBanner": {
    "message": "Este sitio utiliza cookies esenciales para autenticación y preferencias de idioma. No se utilizan cookies de seguimiento ni analíticas.",
    "learnMore": "Más información",
    "dismiss": "Entendido"
  },
  "footer": {
    "privacy": "Política de Privacidad",
    "terms": "Términos de Uso",
    "cookies": "Política de Cookies",
    "license": "Licencia",
    "about": "Acerca de",
    "accessibility": "Accesibilidad"
  },
  "backToHome": "Volver al inicio",
  "lastUpdated": "Última actualización: {date}",
  "tableOfContents": "En esta página",
  "privacy": {
    "title": "Política de Privacidad",
    "intro": "TrueRisk es un proyecto comunitario de código abierto comprometido con la protección de tu privacidad. Esta política explica qué datos recopilamos, por qué y cómo los protegemos.",
    "dataController": {
      "title": "Responsable del Tratamiento",
      "content": "TrueRisk es un proyecto comunitario de código abierto alojado en GitHub. Al no existir una entidad legal formal detrás del proyecto, los mantenedores del proyecto actúan como responsables del tratamiento de datos. Para cualquier consulta relacionada con datos, por favor abre un issue en nuestro repositorio de GitHub o contáctanos a través de los datos que aparecen al final de esta página."
    },
    "dataWeCollect": {
      "title": "Datos que Recopilamos",
      "intro": "Recopilamos diferentes categorías de datos según cómo uses la plataforma:",
      "identity": {
        "title": "Identidad y Autenticación",
        "content": "Dirección de correo electrónico, nombre de usuario, nombre para mostrar, URL de avatar y proveedor de autenticación (Google, GitHub o credenciales). Tu correo electrónico se cifra en reposo."
      },
      "location": {
        "title": "Datos de Ubicación",
        "content": "Direcciones de hogar y trabajo (cifradas en reposo), coordenadas geográficas, preferencias de provincia y — si concedes permiso — ubicación GPS en tiempo real para funciones de emergencia."
      },
      "health": {
        "title": "Salud y Datos Médicos",
        "content": "Condiciones médicas (cifradas en reposo), nivel de movilidad, rango de edad y si dependes de electricidad para equipos médicos. Estos datos se utilizan únicamente para personalizar la orientación de emergencia."
      },
      "emergency": {
        "title": "Contactos de Emergencia",
        "content": "Nombres y números de teléfono de contactos de emergencia (ambos cifrados en reposo). Se utilizan para la función de verificación de seguridad familiar."
      },
      "household": {
        "title": "Información del Hogar",
        "content": "Detalles de los miembros del hogar, información de mascotas y necesidades especiales. Se utilizan para generar planes de preparación personalizados y orientación de emergencia."
      },
      "building": {
        "title": "Detalles del Edificio",
        "content": "Año de construcción, materiales de construcción, número de plantas, nivel del piso y estado del edificio. Se utilizan para evaluar la vulnerabilidad ante peligros naturales."
      },
      "economic": {
        "title": "Vulnerabilidad Económica",
        "content": "Rango de ingresos, estado de seguros, rango de valor de propiedad y ahorros de emergencia. Se utilizan para adaptar las recomendaciones de preparación a tu situación."
      },
      "safety": {
        "title": "Verificaciones de Seguridad",
        "content": "Tu estado de seguridad durante emergencias (seguro, necesita ayuda, evacuando, refugiado), ubicación y mensajes opcionales. Se comparte con los miembros de tu familia vinculados."
      },
      "family": {
        "title": "Vínculos Familiares",
        "content": "Conexiones con otros usuarios que designes como familia, amigos o vecinos. Se utilizan para verificaciones mutuas de seguridad durante emergencias."
      },
      "community": {
        "title": "Reportes Comunitarios",
        "content": "Reportes de peligros que envías incluyendo tipo, gravedad, ubicación, descripción y fotos opcionales. Estos son visibles para otros usuarios en la zona afectada."
      },
      "preparedness": {
        "title": "Datos de Preparación",
        "content": "Estado de finalización de listas de verificación, planes de emergencia (incluyendo puntos de encuentro, planes de comunicación, información de seguros y ubicación de documentos) y puntuaciones de preparación a lo largo del tiempo."
      },
      "notifications": {
        "title": "Preferencias de Notificación",
        "content": "Endpoints de notificaciones push, números de teléfono para alertas SMS, IDs de chat de Telegram y tus preferencias de entrega de alertas (canales, umbrales de gravedad, horarios de silencio)."
      }
    },
    "legalBasis": {
      "title": "Base Legal del Tratamiento",
      "intro": "Según el Artículo 6 del RGPD, tratamos tus datos sobre las siguientes bases:",
      "consent": "Consentimiento — Eliges crear una cuenta y proporcionar información de perfil opcional. Puedes retirar el consentimiento en cualquier momento eliminando tu cuenta.",
      "contract": "Ejecución contractual — Tratamiento necesario para proporcionar el servicio para el que te registraste (alertas de riesgo, orientación de emergencia, herramientas de preparación).",
      "legitimate": "Interés legítimo — Medidas de seguridad, prevención de abusos y mejora del servicio.",
      "vital": "Intereses vitales — Funciones de seguridad de emergencia (verificaciones de seguridad, estado familiar) donde el tratamiento puede ser necesario para proteger la vida."
    },
    "howWeUse": {
      "title": "Cómo Usamos tus Datos",
      "content": "Tus datos se utilizan para: calcular puntuaciones de riesgo personalizadas para tu ubicación, enviar alertas relevantes de peligros, generar orientación de emergencia adaptada a tu perfil (salud, movilidad, hogar), permitir la coordinación de seguridad familiar durante emergencias, hacer seguimiento de tu progreso de preparación y facilitar los reportes comunitarios de peligros."
    },
    "storage": {
      "title": "Almacenamiento y Cifrado de Datos",
      "content": "Tus datos se almacenan en servidores ubicados en la Unión Europea (infraestructura de hosting Cubepath). Los campos sensibles — incluyendo direcciones de correo electrónico, direcciones de hogar y trabajo, condiciones médicas, nombres de contactos de emergencia y números de teléfono — se cifran en reposo usando cifrado simétrico Fernet. Las contraseñas se hashean y nunca se almacenan en texto plano."
    },
    "retention": {
      "title": "Retención de Datos",
      "content": "Los datos de la cuenta se conservan mientras tu cuenta exista. Los informes de riesgo de propiedades expiran automáticamente después de 30 días. Las verificaciones de seguridad expiran según su duración configurada. Puedes eliminar tu cuenta completa y todos los datos asociados en cualquier momento a través de la configuración del perfil."
    },
    "thirdParty": {
      "title": "Servicios de Terceros",
      "intro": "TrueRisk se integra con los siguientes servicios externos:",
      "google": "Google OAuth — Proveedor de autenticación. Sujeto a la Política de Privacidad de Google.",
      "github": "GitHub OAuth — Proveedor de autenticación. Sujeto a la Política de Privacidad de GitHub.",
      "openmeteo": "Open-Meteo — API meteorológica de código abierto. Recibe datos de ubicación a nivel provincial (no datos personales) para obtener información meteorológica.",
      "aemet": "AEMET (Agencia Estatal de Meteorología) — Datos oficiales meteorológicos y de alertas. No se comparten datos personales.",
      "maplibre": "OpenFreeMap / MapLibre — Renderizado de mosaicos de mapas. Tu navegador solicita mosaicos directamente; la dirección IP es visible para el servidor de mosaicos.",
      "nominatim": "Nominatim / OpenStreetMap — Servicio de geocodificación. Las direcciones se envían para resolver coordenadas. Sujeto a la política de privacidad de OpenStreetMap."
    },
    "transfers": {
      "title": "Transferencias Internacionales de Datos",
      "content": "Tus datos principales se almacenan dentro de la UE. Sin embargo, si te autentificas a través de Google o GitHub, esos proveedores pueden procesar datos de autenticación fuera de la UE bajo sus propios acuerdos de procesamiento de datos conformes al RGPD."
    },
    "rights": {
      "title": "Tus Derechos",
      "intro": "Según el RGPD, tienes los siguientes derechos:",
      "access": "Derecho de acceso — Solicitar una copia de todos los datos que tenemos sobre ti.",
      "rectification": "Derecho de rectificación — Corregir datos inexactos a través de la configuración de tu perfil o contactándonos.",
      "erasure": "Derecho de supresión — Eliminar tu cuenta y todos los datos asociados en cualquier momento a través de la configuración del perfil.",
      "portability": "Derecho a la portabilidad de datos — Solicitar tus datos en un formato estructurado y legible por máquina.",
      "restriction": "Derecho a la limitación — Solicitar que limitemos el tratamiento de tus datos.",
      "objection": "Derecho de oposición — Oponerte al tratamiento basado en interés legítimo.",
      "withdraw": "Derecho a retirar el consentimiento — Retirar el consentimiento en cualquier momento sin afectar el tratamiento anterior."
    },
    "exerciseRights": {
      "title": "Cómo Ejercer tus Derechos",
      "content": "Para ejercer cualquiera de estos derechos, puedes: eliminar tu cuenta directamente a través de la configuración del perfil, abrir un issue en nuestro repositorio de GitHub o enviarnos un correo electrónico a la dirección indicada abajo. Responderemos en un plazo de 30 días según lo requiere el RGPD."
    },
    "children": {
      "title": "Privacidad de Menores",
      "content": "TrueRisk no está dirigido a menores de 16 años. No recopilamos conscientemente datos personales de menores de 16 años. Si crees que un menor nos ha proporcionado datos personales, por favor contáctanos y los eliminaremos."
    },
    "changes": {
      "title": "Cambios en esta Política",
      "content": "Podemos actualizar esta política de privacidad de vez en cuando. Los cambios se publicarán en esta página con una fecha actualizada. El uso continuado de TrueRisk después de los cambios constituye la aceptación de la política actualizada."
    },
    "contact": {
      "title": "Contacto",
      "content": "Para consultas relacionadas con la privacidad, por favor abre un issue en nuestro repositorio de GitHub o envíanos un correo electrónico a:",
      "email": "privacy@truerisk.cloud",
      "github": "github.com/javierdejesusda/TrueRisk"
    }
  },
  "terms": {
    "title": "Términos de Uso",
    "intro": "Al acceder o utilizar TrueRisk, aceptas quedar vinculado por estos términos. Si no estás de acuerdo, por favor no uses el servicio.",
    "acceptance": {
      "title": "Aceptación de los Términos",
      "content": "Estos Términos de Uso rigen tu acceso y uso de TrueRisk, una plataforma de inteligencia de riesgo multi-peligro para España. Al crear una cuenta o usar cualquier función de la plataforma, aceptas estos términos en su totalidad."
    },
    "serviceDescription": {
      "title": "Descripción del Servicio",
      "content": "TrueRisk proporciona puntuación de riesgo basada en ML para 7 peligros naturales (inundación, incendio forestal, sequía, ola de calor, sísmico, ola de frío, tormenta de viento) para las 52 provincias españolas. Las funciones incluyen monitorización meteorológica en tiempo real, orientación de emergencia personalizada, reportes comunitarios de peligros, verificaciones de seguridad familiar y herramientas de planificación de preparación."
    },
    "accounts": {
      "title": "Registro de Cuenta",
      "content": "Debes proporcionar información precisa al crear una cuenta. Eres responsable de mantener la seguridad de tu contraseña y cuenta. Una cuenta por persona. Debes tener al menos 16 años para crear una cuenta."
    },
    "acceptableUse": {
      "title": "Uso Aceptable",
      "content": "Te comprometes a no: enviar reportes comunitarios de peligros falsos o engañosos, usar sistemas automatizados para extraer datos o sobrecargar la plataforma, suplantar a otros usuarios o funcionarios, usar la plataforma para fines ilegales o intentar obtener acceso no autorizado a otras cuentas o infraestructura del sistema."
    },
    "riskDisclaimer": {
      "title": "Aviso sobre Información de Riesgo",
      "important": "IMPORTANTE",
      "content": "Las puntuaciones de riesgo, predicciones de peligros y resúmenes generados por IA proporcionados por TrueRisk son solo con fines informativos. Son producidos por modelos de aprendizaje automático y pueden contener inexactitudes o errores.",
      "notSubstitute": "TrueRisk no es un sustituto de los servicios oficiales de emergencia. En cualquier emergencia, sigue siempre las instrucciones de Protección Civil, AEMET y los servicios de emergencia (112). No confíes únicamente en TrueRisk para decisiones que afecten la seguridad de la vida.",
      "noGuarantee": "No garantizamos que la plataforma esté disponible durante eventos de emergencia reales. Las condiciones de red, la capacidad del servidor y otros factores pueden afectar la disponibilidad cuando más lo necesites."
    },
    "communityContent": {
      "title": "Reportes Comunitarios y Contenido del Usuario",
      "content": "Los reportes comunitarios de peligros son enviados por usuarios y no están verificados por fuentes oficiales. TrueRisk no es responsable de la precisión del contenido enviado por usuarios. Al enviar un reporte, otorgas a TrueRisk una licencia no exclusiva para mostrarlo a otros usuarios en la zona afectada. Conservas la propiedad de tu contenido."
    },
    "intellectualProperty": {
      "title": "Propiedad Intelectual",
      "content": "TrueRisk es software de código abierto publicado bajo la Licencia MIT. Eres libre de usar, modificar y distribuir el código fuente de acuerdo con los términos de la licencia. El nombre y logotipo de TrueRisk son marcas del proyecto utilizadas para identificar este despliegue específico."
    },
    "liability": {
      "title": "Limitación de Responsabilidad",
      "content": "TrueRisk se proporciona como un proyecto comunitario de código abierto \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo, expresas o implícitas. En la máxima medida permitida por la ley, los contribuidores del proyecto no serán responsables de ningún daño derivado de: decisiones tomadas basándose en puntuaciones de riesgo o predicciones, información de peligros inexacta o retrasada, indisponibilidad del servicio durante emergencias, pérdida de datos o cualquier otro uso de la plataforma."
    },
    "availability": {
      "title": "Disponibilidad del Servicio",
      "content": "TrueRisk es un proyecto comunitario sin Acuerdo de Nivel de Servicio (SLA). La plataforma puede no estar disponible por mantenimiento, actualizaciones o problemas de infraestructura. Hacemos nuestro mejor esfuerzo para mantener el tiempo de actividad pero no proporcionamos garantías."
    },
    "termination": {
      "title": "Terminación",
      "content": "Puedes eliminar tu cuenta en cualquier momento a través de la configuración del perfil, lo que elimina permanentemente todos tus datos. Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos o tengan comportamiento abusivo."
    },
    "governingLaw": {
      "title": "Ley Aplicable",
      "content": "Estos términos se rigen por las leyes de España. Cualquier disputa se someterá a la jurisdicción de los tribunales de España."
    },
    "changesToTerms": {
      "title": "Cambios en estos Términos",
      "content": "Podemos actualizar estos términos de vez en cuando. Los cambios se publicarán en esta página con una fecha actualizada. El uso continuado de TrueRisk después de los cambios constituye la aceptación de los términos actualizados."
    }
  },
  "cookies": {
    "title": "Política de Cookies",
    "intro": "Esta política explica cómo TrueRisk utiliza cookies y tecnologías similares.",
    "whatAreCookies": {
      "title": "Qué son las Cookies",
      "content": "Las cookies son pequeños archivos de texto almacenados en tu dispositivo por tu navegador web. Se utilizan para recordar preferencias y habilitar funcionalidades esenciales. El almacenamiento local es una tecnología similar del navegador que almacena datos localmente en tu dispositivo."
    },
    "cookiesWeUse": {
      "title": "Cookies que Utilizamos",
      "intro": "TrueRisk utiliza solo cookies esenciales y funcionales:",
      "locale": {
        "name": "locale",
        "type": "Funcional",
        "purpose": "Almacena tu preferencia de idioma (español o inglés)",
        "duration": "Persistente"
      },
      "session": {
        "name": "authjs.session-token",
        "type": "Esencial",
        "purpose": "Mantiene tu sesión de autenticación",
        "duration": "7 días"
      },
      "secureSession": {
        "name": "__Secure-authjs.session-token",
        "type": "Esencial",
        "purpose": "Sesión de autenticación segura (solo HTTPS)",
        "duration": "7 días"
      }
    },
    "localStorage": {
      "title": "Almacenamiento Local",
      "intro": "TrueRisk también utiliza el almacenamiento local del navegador para lo siguiente:",
      "province": {
        "name": "truerisk-province",
        "purpose": "Tus preferencias de la aplicación incluyendo provincia seleccionada, idioma, configuración de capas del mapa y preferencias de notificación"
      },
      "consent": {
        "name": "truerisk-cookie-consent",
        "purpose": "Recuerda que has visto y cerrado el banner informativo de cookies"
      }
    },
    "noTracking": {
      "title": "Sin Analíticas ni Seguimiento",
      "content": "TrueRisk no utiliza cookies de analíticas, publicidad ni seguimiento. No usamos Google Analytics, Facebook Pixel ni ninguna tecnología de seguimiento similar. Tu comportamiento de navegación en TrueRisk no se rastrea ni se perfila."
    },
    "thirdPartyCookies": {
      "title": "Cookies de Terceros",
      "content": "TrueRisk no establece cookies de terceros. Cuando te autentificas a través de Google o GitHub, se te redirige a sus sitios que pueden establecer sus propias cookies. Estas se rigen por sus respectivas políticas de cookies."
    },
    "managing": {
      "title": "Gestión de Cookies",
      "content": "Puedes controlar las cookies a través de la configuración de tu navegador. La mayoría de los navegadores permiten bloquear o eliminar cookies. Sin embargo, deshabilitar las cookies esenciales impedirá que inicies sesión en TrueRisk. Limpiar el almacenamiento local restablecerá tus preferencias de la aplicación."
    },
    "changes": {
      "title": "Cambios en esta Política",
      "content": "Podemos actualizar esta política de cookies de vez en cuando. Los cambios se publicarán en esta página con una fecha actualizada."
    }
  },
  "license": {
    "title": "Licencia",
    "intro": "TrueRisk es software libre y de código abierto.",
    "mitTitle": "Licencia MIT",
    "mitText": "Copyright (c) 2025-2026 Contribuidores de TrueRisk\n\nPor la presente se concede permiso, libre de cargos, a cualquier persona que obtenga una copia de este software y de los archivos de documentación asociados (el \"Software\"), a utilizar el Software sin restricción, incluyendo sin limitación los derechos a usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del Software, y a permitir a las personas a las que se les proporcione el Software a hacer lo mismo, sujeto a las siguientes condiciones:\n\nEl aviso de copyright anterior y este aviso de permiso se incluirán en todas las copias o partes sustanciales del Software.\n\nEL SOFTWARE SE PROPORCIONA \"COMO ESTÁ\", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A GARANTÍAS DE COMERCIALIZACIÓN, IDONEIDAD PARA UN PROPÓSITO PARTICULAR E INCUMPLIMIENTO. EN NINGÚN CASO LOS AUTORES O TITULARES DEL COPYRIGHT SERÁN RESPONSABLES DE NINGUNA RECLAMACIÓN, DAÑOS U OTRAS RESPONSABILIDADES, YA SEA EN UNA ACCIÓN DE CONTRATO, AGRAVIO O CUALQUIER OTRO MOTIVO, DERIVADA DE, FUERA DE O EN CONEXIÓN CON EL SOFTWARE O EL USO U OTRO TIPO DE ACCIONES EN EL SOFTWARE.",
    "whatThisMeans": {
      "title": "Qué Significa Esto",
      "content": "La Licencia MIT es una de las licencias de código abierto más permisivas. Eres libre de:",
      "use": "Usar TrueRisk para cualquier propósito, incluyendo uso comercial",
      "modify": "Modificar el código fuente según tus necesidades",
      "distribute": "Distribuir copias del código original o modificado",
      "sublicense": "Incluir TrueRisk en software propietario",
      "condition": "La única condición es que incluyas el aviso de copyright original y el texto de la licencia en cualquier copia o parte sustancial del software."
    },
    "contributing": {
      "title": "Contribuir",
      "content": "Damos la bienvenida a contribuciones de la comunidad. Para contribuir, visita nuestro repositorio de GitHub, haz un fork del proyecto y envía un pull request. Todas las contribuciones se realizan bajo la misma Licencia MIT.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "thirdParty": {
      "title": "Licencias de Terceros",
      "intro": "TrueRisk está construido con las siguientes tecnologías de código abierto:",
      "items": {
        "nextjs": "Next.js — Licencia MIT",
        "react": "React — Licencia MIT",
        "maplibre": "MapLibre GL JS — Licencia BSD 3-Clause",
        "fastapi": "FastAPI — Licencia MIT",
        "tailwind": "Tailwind CSS — Licencia MIT",
        "framer": "Framer Motion — Licencia MIT",
        "recharts": "Recharts — Licencia MIT",
        "zustand": "Zustand — Licencia MIT",
        "lucide": "Lucide Icons — Licencia ISC"
      }
    }
  },
  "about": {
    "title": "Acerca de TrueRisk",
    "mission": {
      "title": "Nuestra Misión",
      "content": "TrueRisk tiene como objetivo hacer que la información de riesgo de peligros naturales sea accesible, comprensible y accionable para todos en España. Creemos que cada ciudadano merece inteligencia de riesgo en tiempo real y personalizada — no solo datos sin procesar, sino orientación clara sobre qué hacer cuando los peligros amenazan su zona."
    },
    "project": {
      "title": "El Proyecto",
      "content": "TrueRisk es un proyecto comunitario de código abierto alojado en GitHub bajo la Licencia MIT. Fue creado para abordar la brecha entre los datos de peligros disponibles y la preparación ciudadana. La plataforma combina fuentes de datos oficiales con aprendizaje automático para proporcionar inteligencia de riesgo que anteriormente solo estaba disponible para agencias especializadas."
    },
    "whatWeDo": {
      "title": "Qué Hacemos",
      "content": "TrueRisk monitoriza 7 peligros naturales en las 52 provincias españolas: inundaciones, incendios forestales, sequía, olas de calor, eventos sísmicos, olas de frío y tormentas de viento. Cada peligro tiene un modelo ML dedicado (XGBoost, LightGBM o PyTorch) que procesa datos meteorológicos en tiempo real, patrones históricos y características geográficas para producir puntuaciones de riesgo actualizadas continuamente."
    },
    "thirdParty": {
      "title": "Fuentes de Datos y Atribución",
      "intro": "TrueRisk depende de los siguientes servicios externos y fuentes de datos:",
      "google": {
        "name": "Google OAuth",
        "description": "Proveedor de autenticación para inicio de sesión"
      },
      "github": {
        "name": "GitHub OAuth",
        "description": "Proveedor de autenticación para inicio de sesión"
      },
      "openmeteo": {
        "name": "Open-Meteo",
        "description": "API meteorológica de código abierto que proporciona datos en tiempo real y pronósticos"
      },
      "aemet": {
        "name": "AEMET",
        "description": "Agencia Estatal de Meteorología — observaciones meteorológicas oficiales, pronósticos y avisos de peligros"
      },
      "openfreemap": {
        "name": "OpenFreeMap / MapLibre",
        "description": "Renderizado de mosaicos de mapas de código abierto y componentes de mapas interactivos"
      },
      "nominatim": {
        "name": "Nominatim / OpenStreetMap",
        "description": "Servicio de geocodificación para resolver direcciones a coordenadas"
      },
      "ine": {
        "name": "INE",
        "description": "Instituto Nacional de Estadística — datos demográficos provinciales y municipales"
      }
    },
    "techStack": {
      "title": "Stack Tecnológico",
      "frontend": "Frontend: Next.js 16, React 19, Tailwind CSS v4, MapLibre GL, Framer Motion, Recharts",
      "backend": "Backend: FastAPI, SQLAlchemy (async), PostgreSQL, Alembic",
      "ml": "ML/IA: XGBoost, LightGBM, PyTorch (Temporal Fusion Transformer)",
      "infra": "Infraestructura: Docker, Dokploy, hosting Cubepath (UE)"
    },
    "contribute": {
      "title": "Cómo Contribuir",
      "content": "TrueRisk está abierto a contribuciones de todo tipo: código, documentación, traducciones, reportes de errores y sugerencias de funciones. Visita nuestro repositorio de GitHub para comenzar.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "contact": {
      "title": "Contacto",
      "content": "Para consultas generales, solicitudes de funciones o reportes de errores, por favor abre un issue en nuestro repositorio de GitHub. Para asuntos relacionados con la privacidad, consulta nuestra Política de Privacidad.",
      "email": "contact@truerisk.cloud"
    }
  },
  "accessibility": {
    "title": "Declaración de Accesibilidad",
    "commitment": {
      "title": "Nuestro Compromiso",
      "content": "TrueRisk está comprometido con garantizar la accesibilidad digital para todos los usuarios, incluyendo personas con discapacidad. Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 en el Nivel AA."
    },
    "features": {
      "title": "Características de Accesibilidad",
      "skipLink": "Enlace para saltar al contenido para usuarios de teclado",
      "semantic": "Estructura HTML semántica en toda la aplicación",
      "keyboard": "Soporte de navegación por teclado para todos los elementos interactivos",
      "aria": "Etiquetas y roles ARIA para contenido dinámico",
      "contrast": "Ratios de contraste de color que cumplen los estándares WCAG AA para texto",
      "responsive": "Diseño responsivo que funciona en varios niveles de zoom (hasta 200%)",
      "motion": "Soporte de movimiento reducido — las animaciones respetan prefers-reduced-motion",
      "focus": "Indicadores de enfoque visibles en todos los elementos interactivos"
    },
    "limitations": {
      "title": "Limitaciones Conocidas",
      "map": "Mapa interactivo (MapLibre GL) — El componente de mapa tiene soporte limitado de teclado y lector de pantalla. La selección de provincias y los datos de peligros también están disponibles a través de interfaces sin mapa.",
      "charts": "Visualizaciones de datos (Recharts) — Los gráficos proporcionan representación visual de datos de riesgo. Los puntos de datos clave están disponibles en forma de texto en otras partes de la interfaz.",
      "realtime": "Actualizaciones en tiempo real — Parte del contenido dinámico (alertas SSE, meteorología en vivo) puede no anunciarse inmediatamente a los lectores de pantalla."
    },
    "assistive": {
      "title": "Tecnología de Asistencia",
      "content": "TrueRisk ha sido desarrollado con compatibilidad para lectores de pantalla, navegación solo con teclado y zoom del navegador. Probamos con tecnologías de asistencia comunes y agradecemos los comentarios sobre problemas de accesibilidad."
    },
    "reporting": {
      "title": "Reportar Problemas",
      "content": "Si encuentras alguna barrera de accesibilidad mientras usas TrueRisk, por favor háznos saber. Los problemas de accesibilidad se tratan como errores de alta prioridad. Puedes reportar problemas en nuestro repositorio de GitHub o contactarnos directamente.",
      "github": "github.com/javierdejesusda/TrueRisk"
    },
    "contact": {
      "title": "Contacto",
      "content": "Para asuntos relacionados con la accesibilidad:",
      "email": "accessibility@truerisk.cloud"
    }
  }
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add messages/es.json
git commit -m "feat(i18n): add Legal namespace to Spanish translations"
```

---

## Task 3: Create LegalPageShell Component

**Files:**
- Create: `src/components/legal/legal-page-shell.tsx`

- [ ] **Step 1: Create the legal-page-shell component**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Section {
  id: string;
  label: string;
}

interface LegalPageShellProps {
  titleKey: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export function LegalPageShell({ titleKey, lastUpdated, sections, children }: LegalPageShellProps) {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        {/* Title */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {titleKey}
        </h1>

        {/* Last updated */}
        <p className="mt-2 text-sm text-text-muted">
          {t('lastUpdated', { date: lastUpdated })}
        </p>

        <div className="mt-10 flex gap-12">
          {/* Table of Contents — desktop sidebar */}
          {sections.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <nav className="sticky top-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t('tableOfContents')}
                </p>
                <ul className="space-y-2 border-l border-border pl-4">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Content */}
          <article className="min-w-0 flex-1 prose-legal">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add prose-legal styles to globals.css**

Add the following at the end of `src/app/globals.css`:

```css
/* ── Legal page prose ─────────────────────────────────────────── */

.prose-legal h2 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  scroll-margin-top: 2rem;
}

.prose-legal h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.prose-legal p {
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.prose-legal ul {
  color: var(--color-text-secondary);
  line-height: 1.7;
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.prose-legal li {
  margin-bottom: 0.5rem;
}

.prose-legal strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.prose-legal a {
  color: var(--color-accent-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 150ms;
}

.prose-legal a:hover {
  color: var(--color-text-primary);
}

.prose-legal code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  background: var(--color-bg-secondary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  color: var(--color-text-primary);
}

.prose-legal table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.prose-legal th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.prose-legal td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.prose-legal .legal-callout {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent-yellow);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.prose-legal .legal-callout strong {
  color: var(--color-accent-yellow);
}

.prose-legal pre {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/legal/legal-page-shell.tsx src/app/globals.css
git commit -m "feat: add LegalPageShell component and prose-legal styles"
```

---

## Task 4: Create Legal Layout

**Files:**
- Create: `src/app/(legal)/layout.tsx`

- [ ] **Step 1: Create the (legal) layout**

```tsx
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export const metadata = {
  robots: 'index, follow',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-text-primary transition-opacity hover:opacity-80"
          >
            True<span className="text-accent-green">Risk</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-border bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">Terms of Use</Link>
            <Link href="/cookies" className="transition-colors hover:text-text-primary">Cookie Policy</Link>
            <Link href="/license" className="transition-colors hover:text-text-primary">License</Link>
            <Link href="/about" className="transition-colors hover:text-text-primary">About</Link>
            <Link href="/accessibility" className="transition-colors hover:text-text-primary">Accessibility</Link>
          </nav>
          <p className="mt-4 text-center text-xs text-text-muted">
            © {new Date().getFullYear()} TrueRisk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Note:** The footer links here are hardcoded in English because this is a server component. The individual page content uses next-intl for translations. The footer link labels are consistent across languages as navigation aids.

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/layout.tsx
git commit -m "feat: add (legal) route group layout with header and footer"
```

---

## Task 5: Create Privacy Policy Page

**Files:**
- Create: `src/app/(legal)/privacy/page.tsx`

- [ ] **Step 1: Create the privacy policy page**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function PrivacyPage() {
  const t = useTranslations('Legal.privacy');

  const sections = [
    { id: 'data-controller', label: t('dataController.title') },
    { id: 'data-we-collect', label: t('dataWeCollect.title') },
    { id: 'legal-basis', label: t('legalBasis.title') },
    { id: 'how-we-use', label: t('howWeUse.title') },
    { id: 'storage', label: t('storage.title') },
    { id: 'retention', label: t('retention.title') },
    { id: 'third-party', label: t('thirdParty.title') },
    { id: 'transfers', label: t('transfers.title') },
    { id: 'rights', label: t('rights.title') },
    { id: 'exercise-rights', label: t('exerciseRights.title') },
    { id: 'children', label: t('children.title') },
    { id: 'changes', label: t('changes.title') },
    { id: 'contact', label: t('contact.title') },
  ];

  const dataCategories = [
    'identity', 'location', 'health', 'emergency', 'household', 'building',
    'economic', 'safety', 'family', 'community', 'preparedness', 'notifications',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      {/* Data Controller */}
      <h2 id="data-controller">{t('dataController.title')}</h2>
      <p>{t('dataController.content')}</p>

      {/* Data We Collect */}
      <h2 id="data-we-collect">{t('dataWeCollect.title')}</h2>
      <p>{t('dataWeCollect.intro')}</p>
      {dataCategories.map((cat) => (
        <div key={cat}>
          <h3>{t(`dataWeCollect.${cat}.title`)}</h3>
          <p>{t(`dataWeCollect.${cat}.content`)}</p>
        </div>
      ))}

      {/* Legal Basis */}
      <h2 id="legal-basis">{t('legalBasis.title')}</h2>
      <p>{t('legalBasis.intro')}</p>
      <ul>
        <li><strong>{t('legalBasis.consent')}</strong></li>
        <li><strong>{t('legalBasis.contract')}</strong></li>
        <li><strong>{t('legalBasis.legitimate')}</strong></li>
        <li><strong>{t('legalBasis.vital')}</strong></li>
      </ul>

      {/* How We Use */}
      <h2 id="how-we-use">{t('howWeUse.title')}</h2>
      <p>{t('howWeUse.content')}</p>

      {/* Storage */}
      <h2 id="storage">{t('storage.title')}</h2>
      <p>{t('storage.content')}</p>

      {/* Retention */}
      <h2 id="retention">{t('retention.title')}</h2>
      <p>{t('retention.content')}</p>

      {/* Third-Party Services */}
      <h2 id="third-party">{t('thirdParty.title')}</h2>
      <p>{t('thirdParty.intro')}</p>
      <ul>
        <li>{t('thirdParty.google')}</li>
        <li>{t('thirdParty.github')}</li>
        <li>{t('thirdParty.openmeteo')}</li>
        <li>{t('thirdParty.aemet')}</li>
        <li>{t('thirdParty.maplibre')}</li>
        <li>{t('thirdParty.nominatim')}</li>
      </ul>

      {/* International Transfers */}
      <h2 id="transfers">{t('transfers.title')}</h2>
      <p>{t('transfers.content')}</p>

      {/* Your Rights */}
      <h2 id="rights">{t('rights.title')}</h2>
      <p>{t('rights.intro')}</p>
      <ul>
        <li>{t('rights.access')}</li>
        <li>{t('rights.rectification')}</li>
        <li>{t('rights.erasure')}</li>
        <li>{t('rights.portability')}</li>
        <li>{t('rights.restriction')}</li>
        <li>{t('rights.objection')}</li>
        <li>{t('rights.withdraw')}</li>
      </ul>

      {/* Exercise Rights */}
      <h2 id="exercise-rights">{t('exerciseRights.title')}</h2>
      <p>{t('exerciseRights.content')}</p>

      {/* Children */}
      <h2 id="children">{t('children.title')}</h2>
      <p>{t('children.content')}</p>

      {/* Changes */}
      <h2 id="changes">{t('changes.title')}</h2>
      <p>{t('changes.content')}</p>

      {/* Contact */}
      <h2 id="contact">{t('contact.title')}</h2>
      <p>{t('contact.content')}</p>
      <ul>
        <li>
          <a href={`mailto:${t('contact.email')}`}>{t('contact.email')}</a>
        </li>
        <li>
          <a href={`https://${t('contact.github')}`} target="_blank" rel="noopener noreferrer">
            {t('contact.github')}
          </a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
```

- [ ] **Step 2: Verify page renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/privacy`
Expected: Privacy policy page renders with all sections, ToC sidebar, back link, and legal layout

- [ ] **Step 3: Commit**

```bash
git add src/app/(legal)/privacy/page.tsx
git commit -m "feat: add privacy policy page"
```

---

## Task 6: Create Terms of Use Page

**Files:**
- Create: `src/app/(legal)/terms/page.tsx`

- [ ] **Step 1: Create the terms page**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function TermsPage() {
  const t = useTranslations('Legal.terms');

  const sections = [
    { id: 'acceptance', label: t('acceptance.title') },
    { id: 'service-description', label: t('serviceDescription.title') },
    { id: 'accounts', label: t('accounts.title') },
    { id: 'acceptable-use', label: t('acceptableUse.title') },
    { id: 'risk-disclaimer', label: t('riskDisclaimer.title') },
    { id: 'community-content', label: t('communityContent.title') },
    { id: 'intellectual-property', label: t('intellectualProperty.title') },
    { id: 'liability', label: t('liability.title') },
    { id: 'availability', label: t('availability.title') },
    { id: 'termination', label: t('termination.title') },
    { id: 'governing-law', label: t('governingLaw.title') },
    { id: 'changes', label: t('changesToTerms.title') },
  ];

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="acceptance">{t('acceptance.title')}</h2>
      <p>{t('acceptance.content')}</p>

      <h2 id="service-description">{t('serviceDescription.title')}</h2>
      <p>{t('serviceDescription.content')}</p>

      <h2 id="accounts">{t('accounts.title')}</h2>
      <p>{t('accounts.content')}</p>

      <h2 id="acceptable-use">{t('acceptableUse.title')}</h2>
      <p>{t('acceptableUse.content')}</p>

      <h2 id="risk-disclaimer">{t('riskDisclaimer.title')}</h2>
      <div className="legal-callout">
        <p><strong>{t('riskDisclaimer.important')}</strong></p>
        <p>{t('riskDisclaimer.content')}</p>
      </div>
      <p>{t('riskDisclaimer.notSubstitute')}</p>
      <p>{t('riskDisclaimer.noGuarantee')}</p>

      <h2 id="community-content">{t('communityContent.title')}</h2>
      <p>{t('communityContent.content')}</p>

      <h2 id="intellectual-property">{t('intellectualProperty.title')}</h2>
      <p>{t('intellectualProperty.content')}</p>

      <h2 id="liability">{t('liability.title')}</h2>
      <p>{t('liability.content')}</p>

      <h2 id="availability">{t('availability.title')}</h2>
      <p>{t('availability.content')}</p>

      <h2 id="termination">{t('termination.title')}</h2>
      <p>{t('termination.content')}</p>

      <h2 id="governing-law">{t('governingLaw.title')}</h2>
      <p>{t('governingLaw.content')}</p>

      <h2 id="changes">{t('changesToTerms.title')}</h2>
      <p>{t('changesToTerms.content')}</p>
    </LegalPageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/terms/page.tsx
git commit -m "feat: add terms of use page"
```

---

## Task 7: Create Cookie Policy Page

**Files:**
- Create: `src/app/(legal)/cookies/page.tsx`

- [ ] **Step 1: Create the cookies page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/cookies/page.tsx
git commit -m "feat: add cookie policy page"
```

---

## Task 8: Create License Page

**Files:**
- Create: `src/app/(legal)/license/page.tsx`

- [ ] **Step 1: Create the license page**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function LicensePage() {
  const t = useTranslations('Legal.license');

  const sections = [
    { id: 'mit-license', label: t('mitTitle') },
    { id: 'what-this-means', label: t('whatThisMeans.title') },
    { id: 'contributing', label: t('contributing.title') },
    { id: 'third-party', label: t('thirdParty.title') },
  ];

  const thirdPartyKeys = [
    'nextjs', 'react', 'maplibre', 'fastapi', 'tailwind', 'framer', 'recharts', 'zustand', 'lucide',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="mit-license">{t('mitTitle')}</h2>
      <pre>{t('mitText')}</pre>

      <h2 id="what-this-means">{t('whatThisMeans.title')}</h2>
      <p>{t('whatThisMeans.content')}</p>
      <ul>
        <li>{t('whatThisMeans.use')}</li>
        <li>{t('whatThisMeans.modify')}</li>
        <li>{t('whatThisMeans.distribute')}</li>
        <li>{t('whatThisMeans.sublicense')}</li>
      </ul>
      <p>{t('whatThisMeans.condition')}</p>

      <h2 id="contributing">{t('contributing.title')}</h2>
      <p>{t('contributing.content')}</p>
      <p>
        <a href={`https://${t('contributing.github')}`} target="_blank" rel="noopener noreferrer">
          {t('contributing.github')}
        </a>
      </p>

      <h2 id="third-party">{t('thirdParty.title')}</h2>
      <p>{t('thirdParty.intro')}</p>
      <ul>
        {thirdPartyKeys.map((key) => (
          <li key={key}>{t(`thirdParty.items.${key}`)}</li>
        ))}
      </ul>
    </LegalPageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/license/page.tsx
git commit -m "feat: add license page"
```

---

## Task 9: Create About Page

**Files:**
- Create: `src/app/(legal)/about/page.tsx`

- [ ] **Step 1: Create the about page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/about/page.tsx
git commit -m "feat: add about page with credits and attribution"
```

---

## Task 10: Create Accessibility Page

**Files:**
- Create: `src/app/(legal)/accessibility/page.tsx`

- [ ] **Step 1: Create the accessibility page**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function AccessibilityPage() {
  const t = useTranslations('Legal.accessibility');

  const sections = [
    { id: 'commitment', label: t('commitment.title') },
    { id: 'features', label: t('features.title') },
    { id: 'limitations', label: t('limitations.title') },
    { id: 'assistive', label: t('assistive.title') },
    { id: 'reporting', label: t('reporting.title') },
    { id: 'contact', label: t('contact.title') },
  ];

  const featureKeys = [
    'skipLink', 'semantic', 'keyboard', 'aria', 'contrast', 'responsive', 'motion', 'focus',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <h2 id="commitment">{t('commitment.title')}</h2>
      <p>{t('commitment.content')}</p>

      <h2 id="features">{t('features.title')}</h2>
      <ul>
        {featureKeys.map((key) => (
          <li key={key}>{t(`features.${key}`)}</li>
        ))}
      </ul>

      <h2 id="limitations">{t('limitations.title')}</h2>
      <ul>
        <li><strong>MapLibre GL</strong> — {t('limitations.map')}</li>
        <li><strong>Recharts</strong> — {t('limitations.charts')}</li>
        <li><strong>SSE</strong> — {t('limitations.realtime')}</li>
      </ul>

      <h2 id="assistive">{t('assistive.title')}</h2>
      <p>{t('assistive.content')}</p>

      <h2 id="reporting">{t('reporting.title')}</h2>
      <p>{t('reporting.content')}</p>
      <p>
        <a href={`https://${t('reporting.github')}`} target="_blank" rel="noopener noreferrer">
          {t('reporting.github')}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(legal)/accessibility/page.tsx
git commit -m "feat: add accessibility statement page"
```

---

## Task 11: Create CookieBanner Component

**Files:**
- Create: `src/components/legal/cookie-banner.tsx`

- [ ] **Step 1: Create the cookie banner component**

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const STORAGE_KEY = 'truerisk-cookie-consent';

export function CookieBanner() {
  const t = useTranslations('Legal.cookieBanner');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-bg-card/95 backdrop-blur-xl p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t('message')}{' '}
                  <Link
                    href="/cookies"
                    className="text-accent-blue underline underline-offset-2 transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded"
                  >
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={dismiss}
                  className="inline-flex h-9 items-center rounded-lg bg-accent-green px-4 text-sm font-medium text-bg-primary transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
                >
                  {t('dismiss')}
                </button>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/legal/cookie-banner.tsx
git commit -m "feat: add CookieBanner component with localStorage persistence"
```

---

## Task 12: Mount CookieBanner in Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add CookieBanner import and render**

Add the import at the top of the file, after the existing imports:

```tsx
import { CookieBanner } from '@/components/legal/cookie-banner';
```

Then add `<CookieBanner />` inside the `NextIntlClientProvider`, after `</main>`:

The return in `RootLayout` should become:

```tsx
return (
  <html lang={locale}>
    <body
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
        Skip to content
      </a>
      <AuthProvider>
        <NextIntlClientProvider messages={messages}>
          <main id="main-content">
            {children}
          </main>
          <CookieBanner />
        </NextIntlClientProvider>
      </AuthProvider>
    </body>
  </html>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount CookieBanner in root layout"
```

---

## Task 13: Enhance Landing Footer with Legal Links

**Files:**
- Modify: `src/components/landing/footer.tsx`

- [ ] **Step 1: Add legal links to the Footer component**

Replace the entire footer component with:

```tsx
'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const legalLinks = [
  { href: '/privacy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/cookies', key: 'cookies' },
  { href: '/license', key: 'license' },
  { href: '/about', key: 'about' },
  { href: '/accessibility', key: 'accessibility' },
] as const;

export function Footer() {
  const tLanding = useTranslations('Landing');
  const tLegal = useTranslations('Legal.footer');

  return (
    <footer className="w-full border-t border-border bg-bg-primary px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        {/* Tech stack */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
          <span>{tLanding('builtWith')}</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            Next.js
          </span>
          <span className="text-border">|</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            FastAPI
          </span>
          <span className="text-border">|</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            MapLibre
          </span>
        </div>

        {/* Province coverage + GitHub */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
          <span>{tLanding('provincesCoverage')}</span>
          <a
            href="https://github.com/javierdejesusda/TrueRisk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
          {legalLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className="transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
            >
              {tLegal(key)}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-xs text-text-muted">
          {tLanding('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/footer.tsx
git commit -m "feat: add legal links to landing footer"
```

---

## Task 14: Verify Build and Lint

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run ESLint**

Run: `npx eslint .`
Expected: No errors (or only pre-existing warnings)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds. All 6 legal pages are listed in the build output as static or dynamic routes.

- [ ] **Step 4: Fix any issues found and commit**

If type errors or lint issues are found, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve lint and type issues in legal pages"
```

---

## Task 15: Final Commit — All Legal Pages Complete

**Files:** None (verification + final commit if needed)

- [ ] **Step 1: Manually verify all pages render**

Run: `npm run dev`

Navigate to each page and verify it renders correctly:
- `http://localhost:3000/privacy` — Full privacy policy with 13 sections, ToC sidebar
- `http://localhost:3000/terms` — Terms of use with risk disclaimer callout
- `http://localhost:3000/cookies` — Cookie policy with tables
- `http://localhost:3000/license` — MIT license with monospace pre block
- `http://localhost:3000/about` — About with third-party services table
- `http://localhost:3000/accessibility` — Accessibility statement
- Cookie banner appears on first visit, dismisses, stays dismissed on refresh
- Footer legal links work on landing page
- Language switcher works on legal pages
- Back-to-home link works

- [ ] **Step 2: Toggle language and verify Spanish renders**

Switch to Spanish using the language switcher and verify all pages render in Spanish.

- [ ] **Step 3: Final commit if any last fixes were needed**

```bash
git add -A
git commit -m "feat: production-ready legal pages, cookie banner, and enhanced footer"
```
