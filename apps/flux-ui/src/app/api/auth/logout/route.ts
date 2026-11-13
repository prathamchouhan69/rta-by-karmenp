import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, isSecureRequest } from '@/server/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: 0,
  });
  response.headers.set('cache-control', 'no-store');
  return response;
}
