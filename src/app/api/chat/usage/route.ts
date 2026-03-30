import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/chat/usage`, {
    headers,
  });

  return new Response(await backendRes.text(), {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
