import type { UserRole, UserProfile } from '@/types/auth';

export const RUTAS_PROTEGIDAS = [
  '/dashboard',
  '/inventario',
  '/ventas',
  '/usuarios',
] as const;

export type RutaProtegida = (typeof RUTAS_PROTEGIDAS)[number];

const NIVEL_MINIMO: Record<RutaProtegida, number> = {
  '/dashboard': 1,
  '/inventario': 1,
  '/ventas': 2,
  '/usuarios': 3,
};

function rolConAccesoTotal(role: UserRole): boolean {
  return role === 'desarrollador' || role === 'propietario';
}

export function puedeAcceder(perfil: UserProfile | null, ruta: string): boolean {
  if (!perfil) return false;
  if (rolConAccesoTotal(perfil.role)) return true;
  const requerido = NIVEL_MINIMO[ruta as RutaProtegida];
  if (requerido === undefined) return false;
  return perfil.level >= requerido;
}

export function nivelRequerido(ruta: string): number {
  return NIVEL_MINIMO[ruta as RutaProtegida] ?? 1;
}
