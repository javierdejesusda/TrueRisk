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

function parseCapXml(xml: string): AemetCapAlert[] {
  const alerts: AemetCapAlert[] = [];

  const alertBlocks = extractAllTags(xml, 'alert');

  for (const alertBlock of alertBlocks) {
    const identifier = extractTag(alertBlock, 'identifier');
    const sender = extractTag(alertBlock, 'sender');
    const sent = extractTag(alertBlock, 'sent');

    const infoBlocks = extractAllTags(alertBlock, 'info');

    for (const infoBlock of infoBlocks) {
      const event = extractTag(infoBlock, 'event');
      const severityRaw = extractTag(infoBlock, 'severity');
      const severity = mapCapSeverity(severityRaw);
      const headline = extractTag(infoBlock, 'headline');
      const description = extractTag(infoBlock, 'description');
      const onset = extractTag(infoBlock, 'onset');
      const expires = extractTag(infoBlock, 'expires');

      const areaBlocks = extractAllTags(infoBlock, 'area');

      if (areaBlocks.length === 0) {
        // Info block with no area: emit one alert with empty area fields
        alerts.push({
          identifier,
          sender,
          sent,
          severity,
          event,
          headline,
          description,
          areaDesc: '',
          geocode: '',
          onset,
          expires,
        });
        continue;
      }

      for (const areaBlock of areaBlocks) {
        const areaDesc = extractTag(areaBlock, 'areaDesc');

        // Collect all geocode values from this area block
        const geocodeBlocks = extractAllTags(areaBlock, 'geocode');
        const geocodeValues: string[] = [];
        for (const geocodeBlock of geocodeBlocks) {
          const value = extractTag(geocodeBlock, 'value');
          if (value) geocodeValues.push(value);
        }
        const geocode = geocodeValues.join(',');

        alerts.push({
          identifier,
          sender,
          sent,
          severity,
          event,
          headline,
          description,
          areaDesc,
          geocode,
          onset,
          expires,
        });
      }
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
      { headers: { 'api_key': apiKey } }
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

    // Step 2: Fetch actual CAP data
    const dataRes = await fetch(meta.datos);
    if (!dataRes.ok) {
      console.error('AEMET data request failed:', dataRes.status);
      return [];
    }

    const xml = await dataRes.text();
    return parseCapXml(xml);
  } catch (err) {
    console.error('AEMET fetch error:', err);
    return [];
  }
}
