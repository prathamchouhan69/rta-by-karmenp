import { NextResponse, type NextRequest } from 'next/server';
import { FLUX_API_URL, SESSION_COOKIE, SESSION_MAX_AGE } from '@/server/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Send a JSON body.' } }, { status: 400 });
  }
  const input = body as { id?: unknown; password?: unknown };
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  if (!id || !password) {
    return NextResponse.json({ error: { code: 'MISSING_FIELD', message: 'User ID and password are required.' } }, { status: 422 });
  }
  if (id.length > 40 || password.length > 1024) {
    return NextResponse.json({ error: { code: 'BAD_LOGIN', message: 'Wrong id or password.' } }, { status: 401 });
  }

  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const upstream = await fetch(`${FLUX_API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(forwarded ? { 'x-forwarded-for': forwarded } : {}),
      },
      body: JSON.stringify({ id, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const data = (await upstream.json().catch(() => ({}))) as {
      token?: string;
      expiresInSec?: number;
      user?: unknown;
      permissions?: unknown;
      error?: { code?: string; message?: string };
    };
    if (!upstream.ok || !data.token) {
      return NextResponse.json(
        { error: data.error || { code: 'BAD_LOGIN', message: 'Sign in failed.' } },
        { status: upstream.status || 401 },
      );
    }
    const response = NextResponse.json({
      user: data.user,
      permissions: data.permissions,
      expiresInSec: data.expiresInSec || SESSION_MAX_AGE,
    });
    response.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: data.expiresInSec || SESSION_MAX_AGE,
    });
    response.headers.set('cache-control', 'no-store');
    return response;
  } catch {
    return NextResponse.json(
      { error: { code: 'FLUX_UNAVAILABLE', message: 'The Flux server is not reachable. Check that it is running.' } },
      { status: 503 },
    );
  }
}
