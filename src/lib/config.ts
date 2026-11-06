export type ModoEntorno = 'skeleton' | 'production';

export const MODO_ENTORNO: ModoEntorno =
  process.env.NEXT_PUBLIC_ENVIRONMENT_MODE === 'production'
    ? 'production'
    : 'skeleton';

export const ES_MODO_SKELETON = MODO_ENTORNO === 'skeleton';

export const RETARDO_MOCK_MS = Number(process.env.MOCK_DELAY_MS ?? 350);

export const CONFIG_DB = {
  database: process.env.DB_NAME ?? 'skeletor',
  user: process.env.DB_USER ?? 'admin',
  password: process.env.DB_PASSWORD ?? '',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
} as const;
