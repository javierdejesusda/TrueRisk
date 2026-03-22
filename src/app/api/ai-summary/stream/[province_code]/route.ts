import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ province_code: string }> },
) {
  const { province_code } = await params;
  const locale = req.nextUrl.searchParams.get('locale') || 'es';

  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const backendRes = await fetch(
    `${BACKEND_URL}/api/v1/ai-summary/stream/${province_code}?locale=${locale}`,
    { headers },
  );

  if (!backendRes.ok || !backendRes.body) {
    return new Response(await backendRes.text(), { status: backendRes.status });
  }

  return new Response(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
