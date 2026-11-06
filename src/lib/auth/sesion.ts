import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { UserProfile } from '@/types/auth';

const NOMBRE_COOKIE = 'tp_sesion';
const DURACION_S = 60 * 60 * 24 * 7;

function secreto(): string {
  return process.env.SESSION_SECRET ?? 'dev-triple-play';
}

function firmar(valor: string): string {
  return createHmac('sha256', secreto()).update(valor).digest('base64url');
}

interface PayloadSesion extends UserProfile {
  exp: number;
}

export function crearToken(perfil: UserProfile): string {
  const payload: PayloadSesion = {
    ...perfil,
    exp: Math.floor(Date.now() / 1000) + DURACION_S,
  };
  const cuerpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${cuerpo}.${firmar(cuerpo)}`;
}

export function verificarToken(token: string | undefined): UserProfile | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return null;
  const esperada = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(cuerpo, 'base64url').toString('utf8'),
    ) as PayloadSesion;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      level: payload.level,
    };
  } catch {
    return null;
  }
}

export async function establecerSesion(perfil: UserProfile): Promise<void> {
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE, crearToken(perfil), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_S,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}

export async function perfilActual(): Promise<UserProfile | null> {
  const almacen = await cookies();
  return verificarToken(almacen.get(NOMBRE_COOKIE)?.value);
}
