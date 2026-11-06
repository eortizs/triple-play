import { redirect } from 'next/navigation';
import { puedeAcceder } from '@/lib/auth/acceso';
import type { RutaProtegida } from '@/lib/auth/acceso';
import { perfilActual } from '@/lib/auth/sesion';
import type { UserProfile } from '@/types/auth';

export async function exigirAcceso(ruta: RutaProtegida): Promise<UserProfile> {
  const perfil = await perfilActual();
  if (!perfil) {
    redirect('/login');
  }
  if (!puedeAcceder(perfil, ruta)) {
    redirect(`/acceso-denegado?ruta=${ruta}`);
  }
  return perfil;
}
