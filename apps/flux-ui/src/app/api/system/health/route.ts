import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FLUX_API_URL, SESSION_COOKIE } from '@/server/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } }, { status: 401 });
  try {
    const response = await fetch(`${FLUX_API_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ reachable: response.ok, ...data }, { status: response.ok ? 200 : 503, headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ reachable: false, ok: false, code: 'FLUX_UNAVAILABLE' }, { status: 503 });
  }
}
