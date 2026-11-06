import { NextResponse, type NextRequest } from 'next/server';
import { FLUX_API_URL, SESSION_COOKIE } from '@/server/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_ROOTS = new Set([
  'chat', 'money', 'wealth', 'startup', 'live', 'opportunities', 'ocr', 'finance',
  'measurements', 'construction', 'material-prices', 'health', 'jugaad', 'knowledge',
  'proposals', 'tasks', 'briefing', 'documents', 'hsn', 'memory', 'tools', 'board',
  'models', 'audit', 'users', 'me',
]);
const SEGMENT = /^[A-Za-z0-9._~-]+$/;

type Context = { params: Promise<{ path?: string[] }> };

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function handle(request: NextRequest, context: Context): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) return fail(405, 'METHOD_NOT_ALLOWED', 'This method is not proxied.');
  const segments = (await context.params).path || [];
  if (!segments.length || segments[0] !== 'v1' || !segments[1] || !ALLOWED_ROOTS.has(segments[1])) {
    return fail(404, 'NOT_FOUND', 'This Flux endpoint is not exposed to the interface.');
  }
  if (segments.some((segment) => !SEGMENT.test(segment) || segment === '.' || segment === '..')) {
    return fail(400, 'BAD_PATH', 'Invalid endpoint path.');
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return fail(401, 'UNAUTHENTICATED', 'Sign in required.');
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();
  const search = request.nextUrl.search || '';
  const url = `${FLUX_API_URL}/${segments.map(encodeURIComponent).join('/')}${search}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { 'content-type': request.headers.get('content-type') || 'application/json' } : {}),
      },
      body: body || undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(65000),
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'TimeoutError';
    return fail(timeout ? 504 : 503, timeout ? 'FLUX_TIMEOUT' : 'FLUX_UNAVAILABLE', timeout
      ? 'The Flux server took too long to respond.'
      : 'The Flux server is not reachable. Check that it is running.');
  }

  const buffer = await upstream.arrayBuffer();
  const response = new NextResponse(buffer.byteLength ? buffer : null, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(upstream.headers.get('content-disposition') ? { 'content-disposition': upstream.headers.get('content-disposition') as string } : {}),
      ...(upstream.headers.get('x-request-id') ? { 'x-request-id': upstream.headers.get('x-request-id') as string } : {}),
    },
  });
  if (upstream.status === 401) {
    response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  }
  return response;
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
