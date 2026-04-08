import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/v1/chat/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    clearTimeout(timeout);
    const code = (err as Error).name === 'AbortError' ? 'timeout' : 'connection_error';
    return new Response(code, { status: 504 });
  }

  if (!backendRes.ok || !backendRes.body) {
    let errorCode = 'server_error';
    if (backendRes.status === 401 || backendRes.status === 403) errorCode = 'auth_error';
    else if (backendRes.status === 422) errorCode = 'validation_error';
    else if (backendRes.status === 429) errorCode = 'rate_limited';
    return new Response(errorCode, { status: backendRes.status });
  }

  return new Response(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
