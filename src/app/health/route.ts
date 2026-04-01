import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  let backend = 'ok';
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) backend = 'degraded';
  } catch {
    backend = 'unreachable';
  }

  const status = backend === 'ok' ? 'ok' : 'degraded';
  return NextResponse.json(
    { status, frontend: 'ok', backend },
    { status: status === 'ok' ? 200 : 503 }
  );
}
