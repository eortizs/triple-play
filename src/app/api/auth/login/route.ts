import { NextResponse } from 'next/server';
import { perfilActual, establecerSesion } from '@/lib/auth/sesion';
import { getServicios } from '@/lib/services';

export async function POST(request: Request) {
  let credenciales: { username?: string; password?: string };
  try {
    credenciales = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Solicitud inválida' },
      { status: 400 },
    );
  }

  const { username, password } = credenciales;
  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: 'Usuario y contraseña son obligatorios' },
      { status: 400 },
    );
  }

  const servicios = await getServicios();
  const perfil = await servicios.usuarios.authenticate(username, password);
  if (!perfil) {
    return NextResponse.json(
      { ok: false, error: 'Usuario o contraseña incorrectos' },
      { status: 401 },
    );
  }

  await establecerSesion(perfil);
  return NextResponse.json({ ok: true, perfil });
}

export async function GET() {
  const perfil = await perfilActual();
  if (!perfil) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, perfil });
}
