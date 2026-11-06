'use server'

import { revalidatePath } from 'next/cache';
import { puedeAcceder } from '@/lib/auth/acceso';
import { perfilActual } from '@/lib/auth/sesion';
import { getServicios } from '@/lib/services';
import type { EstadoVenta, MetodoPago } from '@/types/domain';

interface EntradaVenta {
  items: Array<{ productoId: string; cantidad: number }>;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
}

export async function crearVentaAccion(
  entrada: EntradaVenta,
): Promise<{ ok: boolean; error?: string }> {
  const perfil = await perfilActual();
  if (!perfil) {
    return { ok: false, error: 'Sesión expirada, inicia sesión de nuevo' };
  }
  if (!puedeAcceder(perfil, '/ventas')) {
    return { ok: false, error: 'No tienes permiso para registrar ventas' };
  }
  if (entrada.items.length === 0) {
    return { ok: false, error: 'Agrega al menos un producto a la venta' };
  }

  const servicios = await getServicios();
  try {
    await servicios.ventas.crearVenta({
      ...entrada,
      vendedor: perfil,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo registrar la venta',
    };
  }

  revalidatePath('/ventas');
  revalidatePath('/inventario');
  revalidatePath('/dashboard');
  return { ok: true };
}
