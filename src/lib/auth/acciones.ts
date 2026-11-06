'use server'

import { redirect } from 'next/navigation';
import { cerrarSesion } from '@/lib/auth/sesion';

export async function cerrarSesionAccion() {
  await cerrarSesion();
  redirect('/login');
}
