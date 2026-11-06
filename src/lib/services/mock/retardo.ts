import { RETARDO_MOCK_MS } from '@/lib/config';

export function retardo(ms: number = RETARDO_MOCK_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
