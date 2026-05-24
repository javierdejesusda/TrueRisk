import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'TrueRisk - Multi-Hazard Climate Risk Intelligence for Spain';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const tagline = 'Multi-Hazard Climate Risk Intelligence for Spain';
  const region = '52 Spanish provinces';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#050508',
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(132, 204, 22, 0.10) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(59, 130, 246, 0.10) 0%, transparent 50%)',
          padding: 80,
          fontFamily: 'system-ui, sans-serif',
          color: '#EEEEF0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            color: '#A0A0B4',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: '#84CC16',
              boxShadow: '0 0 24px rgba(132, 204, 22, 0.65)',
            }}
          />
          <span>{region}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 168,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              display: 'flex',
            }}
          >
            <span style={{ color: '#EEEEF0' }}>True</span>
            <span style={{ color: '#FFFFFF' }}>Risk</span>
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 40,
              fontWeight: 500,
              color: '#EEEEF0',
              maxWidth: 980,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
            fontSize: 20,
            color: '#7A7A90',
          }}
        >
          <span>truerisk.cloud</span>
          <span style={{ letterSpacing: 1 }}>AEMET · Machine Learning · Real-time</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
