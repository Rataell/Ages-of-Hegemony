import 'server-only';
import { LocalPlay } from '@aoh/server/local-play';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
const runtime = globalThis as typeof globalThis & { aohLocal?: LocalPlay };
const local = runtime.aohLocal ??= new LocalPlay();
const cookieName = 'aoh-development-session';
function localOrigin(request: NextRequest) {
  try {
    const origin = new URL(request.headers.get('origin') ?? '');
    // Next normalizes localhost in nextUrl; compare the actual HTTP host instead.
    return ['127.0.0.1', 'localhost'].includes(origin.hostname)
      && origin.host === request.headers.get('host') && origin.protocol === request.nextUrl.protocol;
  } catch { return false; }
}
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'Local Play disponível somente em desenvolvimento.' }, { status: 404 });
  if (!localOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return NextResponse.json({ error: 'Use JSON.' }, { status: 415 });
  const raw = await request.text();
  if (raw.length > 16384) return NextResponse.json({ error: 'Comando muito grande.' }, { status: 413 });
  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    const jar = await cookies(); let token = jar.get(cookieName)?.value;
    if (body.action === 'start') {
      token = await local.start(Number(body.count));
      jar.set(cookieName, token, { httpOnly: true, sameSite: 'strict', path: '/', secure: request.nextUrl.protocol === 'https:' });
    }
    if (!token) return NextResponse.json({ error: 'Inicie uma partida local.' }, { status: 401 });
    let error: string | null = null;
    if (body.action === 'perspective') await local.perspective(token, String(body.playerId));
    if (body.action === 'command' || body.action === 'advance') {
      const result = body.action === 'command' ? await local.command(token, body.command) : await local.advance(token, Number(body.expectedVersion));
      if (!result.ok) error = `${result.error.code}: ${result.error.message}`;
    } else if (!['start', 'view', 'perspective'].includes(String(body.action))) throw new Error('Ação local desconhecida.');
    const data = await local.view(token, typeof body.cityId === 'string' ? body.cityId : undefined, typeof body.hexId === 'string' ? body.hexId : undefined);
    return NextResponse.json({ data, error }, { status: error ? 409 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha na sessão local.' }, { status: 400 });
  }
}
