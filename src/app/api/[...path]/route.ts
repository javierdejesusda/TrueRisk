import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const TIMEOUT_MS = 15_000;

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${BACKEND_URL}/api/v1/${path.join('/')}`;
  const url = new URL(target);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    if (!['host', 'connection'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      signal: controller.signal,
      // @ts-expect-error -- Next.js supports duplex for streaming bodies
      duplex: 'half',
    });

    clearTimeout(timeout);
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
    });
  } catch {
    return NextResponse.json(
      { error: 'service_unavailable', detail: 'Backend is temporarily unavailable. Please retry.' },
      { status: 503, headers: { 'Retry-After': '10' } }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
