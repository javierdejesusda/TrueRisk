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
    if (!['host', 'connection', 'content-length'].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  }

  // Read the full body as a buffer instead of streaming req.body which can
  // silently produce an empty stream in some Next.js/Node.js environments.
  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await req.arrayBuffer();
    headers.set('Content-Length', String(body.byteLength));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseHeaders = new Headers();
    for (const [k, v] of res.headers.entries()) {
      if (!['transfer-encoding', 'content-encoding'].includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    }

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
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
