import { MODO_ENTORNO } from '@/lib/config';
import type { Servicios } from '@/lib/services/types';

export async function getServicios(): Promise<Servicios> {
  if (MODO_ENTORNO === 'production') {
    const { serviciosProduccion } = await import('@/lib/services/production');
    return serviciosProduccion;
  }
  const { serviciosMock } = await import('@/lib/services/mock');
  return serviciosMock;
}
