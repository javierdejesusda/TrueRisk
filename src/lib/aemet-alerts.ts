import type { AemetCapAlert, AemetSeverity } from '@/types/aemet';

function mapCapSeverity(severity: string): AemetSeverity {
  const lower = severity.toLowerCase();
  if (lower === 'extreme' || lower === 'severe') return 'red';
  if (lower === 'moderate') return 'orange';
  if (lower === 'minor') return 'yellow';
  return 'green';
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'g');
  return xml.match(regex) || [];
}

// AEMET zone codes: digits 3-4 are the INE province code for mainland Spain.
// For Canary Islands (CCAA 65), special mapping is needed.
const CANARIAS_ZONE_TO_PROVINCE: Record<string, string> = {
  '90': '35', '91': '35', '92': '35', // Gran Canaria, Fuerteventura, Lanzarote -> Las Palmas
  '93': '38', '94': '38', '95': '38', '96': '38', // Tenerife, La Palma, Gomera, Hierro -> SC Tenerife
};

function zoneCodeToINEProvince(zoneCode: string): string {
  // Remove trailing letters (e.g. "711501C" -> "711501")
  const digits = zoneCode.replace(/[^0-9]/g, '');
  if (digits.length < 4) return '';

  const ccaa = digits.substring(0, 2);
  const provDigits = digits.substring(2, 4);

  // Canary Islands have non-INE province digits
  if (ccaa === '65') {
    return CANARIAS_ZONE_TO_PROVINCE[provDigits] ?? '38';
  }

  // For mainland + Balearics: digits 3-4 are the INE province code
  return provDigits;
}

// Parse TAR archive: extract XML file contents from a TAR buffer.
// TAR format: 512-byte header + file content padded to 512 bytes.
function extractXmlFromTar(buffer: ArrayBuffer): string[] {
  const files: string[] = [];
  const view = new Uint8Array(buffer);
  let offset = 0;

  while (offset + 512 <= view.length) {
    // Check for end-of-archive (two zero blocks)
    let allZero = true;
    for (let i = 0; i < 512; i++) {
      if (view[offset + i] !== 0) { allZero = false; break; }
    }
    if (allZero) break;

    // Read filename (first 100 bytes, null-terminated)
    let nameEnd = offset;
    while (nameEnd < offset + 100 && view[nameEnd] !== 0) nameEnd++;
    const name = new TextDecoder().decode(view.slice(offset, nameEnd));

    // Read file size (offset 124, 12 bytes, octal string)
    const sizeStr = new TextDecoder().decode(view.slice(offset + 124, offset + 136)).trim();
    const fileSize = parseInt(sizeStr, 8) || 0;

    // Move past header
    offset += 512;

    if (fileSize > 0 && name.endsWith('.xml')) {
      const content = new TextDecoder('utf-8').decode(view.slice(offset, offset + fileSize));
      files.push(content);
    }

    // Advance past file content (padded to 512-byte blocks)
    offset += Math.ceil(fileSize / 512) * 512;
  }

  return files;
}

function parseCapXml(xml: string): AemetCapAlert[] {
  const alerts: AemetCapAlert[] = [];

  // Handle both single <alert> and multiple <alert> blocks
  const alertBlocks = extractAllTags(xml, 'alert');
  const blocks = alertBlocks.length > 0 ? alertBlocks : [xml];

  for (const alertBlock of blocks) {
    const identifier = extractTag(alertBlock, 'identifier');
    if (!identifier) continue;
    const sender = extractTag(alertBlock, 'sender');
    const sent = extractTag(alertBlock, 'sent');

    const infoBlocks = extractAllTags(alertBlock, 'info');

    // Only take the first info block (Spanish) - skip English duplicate
    const infoBlock = infoBlocks[0];
    if (!infoBlock) continue;

    const lang = extractTag(infoBlock, 'language');
    // Skip English blocks if somehow first
    if (lang === 'en-GB' && infoBlocks.length > 1) continue;

    const event = extractTag(infoBlock, 'event');
    const severityRaw = extractTag(infoBlock, 'severity');
    const severity = mapCapSeverity(severityRaw);
    const headline = extractTag(infoBlock, 'headline');
    const description = extractTag(infoBlock, 'description');
    const onset = extractTag(infoBlock, 'onset');
    const expires = extractTag(infoBlock, 'expires');

    const areaBlocks = extractAllTags(infoBlock, 'area');

    for (const areaBlock of areaBlocks) {
      const areaDesc = extractTag(areaBlock, 'areaDesc');

      // Extract AEMET zone code and convert to INE province code
      const geocodeBlocks = extractAllTags(areaBlock, 'geocode');
      let ineProvince = '';
      for (const geocodeBlock of geocodeBlocks) {
        const value = extractTag(geocodeBlock, 'value');
        if (value) {
          ineProvince = zoneCodeToINEProvince(value);
          break;
        }
      }

      if (!ineProvince) continue;

      alerts.push({
        identifier,
        sender,
        sent,
        severity,
        event,
        headline,
        description,
        areaDesc,
        geocode: ineProvince, // Now stores 2-digit INE province code
        onset,
        expires,
      });
    }
  }

  return alerts;
}

export async function fetchAemetAlerts(area: string = 'esp'): Promise<AemetCapAlert[]> {
  const apiKey = process.env.AEMET_API_KEY;
  if (!apiKey || apiKey === 'your_aemet_api_key_here') {
    console.warn('AEMET_API_KEY not configured, skipping AEMET alerts');
    return [];
  }

  try {
    // Step 1: Get datos URL
    const metaRes = await fetch(
      `https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/${area}`,
      { headers: { 'api_key': apiKey }, signal: AbortSignal.timeout(8_000) }
    );

    if (!metaRes.ok) {
      console.error('AEMET meta request failed:', metaRes.status);
      return [];
    }

    const meta = await metaRes.json();
    if (!meta.datos) {
      console.error('AEMET response missing datos URL');
      return [];
    }

    // Step 2: Fetch actual CAP data (TAR archive)
    const dataRes = await fetch(meta.datos, { signal: AbortSignal.timeout(8_000) });
    if (!dataRes.ok) {
      console.error('AEMET data request failed:', dataRes.status);
      return [];
    }

    // AEMET returns a TAR archive of XML files
    const buffer = await dataRes.arrayBuffer();
    const xmlFiles = extractXmlFromTar(buffer);

    if (xmlFiles.length === 0) {
      // Fallback: maybe it's plain XML (not TAR)
      const text = new TextDecoder().decode(buffer);
      if (text.includes('<alert')) {
        return parseCapXml(text);
      }
      return [];
    }

    // Parse each XML file and collect all alerts
    const allAlerts: AemetCapAlert[] = [];
    for (const xml of xmlFiles) {
      const parsed = parseCapXml(xml);
      allAlerts.push(...parsed);
    }

    // Deduplicate by identifier + geocode
    const seen = new Set<string>();
    const unique = allAlerts.filter((a) => {
      const key = `${a.identifier}:${a.geocode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  } catch (err) {
    console.error('AEMET fetch error:', err);
    return [];
  }
}
