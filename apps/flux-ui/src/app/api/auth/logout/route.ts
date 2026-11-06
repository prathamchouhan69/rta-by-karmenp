import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/server/config';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  response.headers.set('cache-control', 'no-store');
  return response;
}
