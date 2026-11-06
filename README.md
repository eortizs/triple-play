# triple-play

PWA móvil para administrar micro-negocios informales en México (abarrotes, tiendas de barrio): inventario, ventas y personal organizado en jerarquías por niveles. Construida como **Esqueleto Caminante** (Walking Skeleton): la misma UI corre con datos mock o contra PostgreSQL según el entorno.

## Stack

- **Next.js** (App Router, v16) + **TypeScript**
- **shadcn/ui** (estilo `base-nova`, Base UI) + componentes ReUI (`data-grid`, `filters`, `frame`, `badge`, `alert`)
- **Lucide Icons**
- **PostgreSQL** con columnas JSONB (solo modo production)
- **Tailwind CSS v4**

## Modos de entorno

La conmutación la controla `NEXT_PUBLIC_ENVIRONMENT_MODE`:

| Modo | Origen de datos | Subdominio |
| --- | --- | --- |
| `skeleton` | JSON local con retardo simulado (`MOCK_DELAY_MS`) | `skeleton.triple-play.people-ia.com` |
| `production` | PostgreSQL (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`) | `triple-play.people-ia.com` |

Los servicios están abstraídos en `src/lib/services/`: interfaces comunes (`UsuariosService`, `ProductosService`, `VentasService`) con implementaciones `mock/` y `production/`; la fábrica `getServicios()` resuelve según el modo. La UI no cambia entre entornos.

## Arranque

```bash
pnpm install
pnpm start:all        # dos instancias con puertos dinámicos (skeleton y producción)
pnpm start:skeleton   # solo maquetación (next dev)
pnpm start:production # solo producción
pnpm dev              # desarrollo por defecto en modo skeleton
```

`scripts/encontrar-puerto.mjs` escanea desde 3000 (skeleton) y 4000 (producción) y asigna el primer puerto libre en la VPS, sin colisiones. Para producción con `next start`, primero ejecuta `pnpm build` con `NEXT_PUBLIC_ENVIRONMENT_MODE=production`.

### Base de datos (production)

```bash
psql -U admin -d skeletor -f db/schema.sql
```

Crea tablas `usuarios`, `productos` y `ventas` (con `atributos`/`items` JSONB, índices GIN) y siembra cuentas demo.

## Autenticación jerárquica

Sesión con cookie httpOnly firmada (HMAC-SHA256, `SESSION_SECRET`). El control de accesos por ruta vive en `src/lib/auth/acceso.ts` y lo aplica `src/proxy.ts` (en Next 16 el `middleware.ts` está deprecado y renombrado a `proxy.ts`) con defensa en profundidad en layouts, páginas y server actions:

| Ruta | Requisito |
| --- | --- |
| `/dashboard`, `/inventario` | cualquier usuario autenticado (nivel ≥ 1) |
| `/ventas` | propietario, desarrollador o usuario nivel ≥ 2 |
| `/usuarios` | propietario, desarrollador o usuario nivel ≥ 3 |

Roles: `desarrollador`, `propietario`, `usuario` (niveles 1–3). Tipos en `src/types/auth.ts`.

### Cuentas demo (modo skeleton)

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `dev` | `dev123` | desarrollador |
| `propietario` | `propietario123` | propietario |
| `ana` | `ana123` | usuario · nivel 1 |
| `luis` | `luis123` | usuario · nivel 2 |
| `carla` | `carla123` | usuario · nivel 3 |

## PWA

Manifest, service worker (cache-first para estáticos, network-first para navegaciones) e íconos. Regenera los PNG con `pnpm iconos`. Las metatag `appleWebApp` y `themeColor` están en el layout raíz.

## Variables de entorno

Copia `.env.example` a `.env.local` (skeleton) o usa `.env.production` en la VPS. Nunca commitear `.env*`.

## Despliegue en VPS

La app corre como dos servicios systemd con artefactos separados (`distDir` por modo, ya que `NEXT_PUBLIC_*` se inlinea en el build):

```bash
NEXT_PUBLIC_ENVIRONMENT_MODE=skeleton NEXT_DIST_DIR=.next-skeleton pnpm build
NEXT_PUBLIC_ENVIRONMENT_MODE=production NEXT_DIST_DIR=.next-production pnpm build

systemctl enable --now triple-play-skeleton.service   # :3300
systemctl enable --now triple-play-production.service # :3400
```

El ingress es el contenedor `agente-caddy-1` (Caddyfile en `/root/agente/Caddyfile`), con vhosts hacia `172.18.0.1:3300/3400` y TLS gestionado por Caddy (Let's Encrypt). El firewall (ufw) permite esos puertos desde `172.16.0.0/12` (redes docker).

| URL | Instancia | Origen de datos |
| --- | --- | --- |
| `https://skeleton.triple-play.people-ia.com` | systemd :3300 | JSON mock |
| `https://triple-play.people-ia.com` | systemd :3400 | PostgreSQL `skeletor` |

Nota: el certificado Universal SSL de Cloudflare (`*.people-ia.com`) no cubre subdominios de segundo nivel (`skeleton.triple-play…`). Para ese host se requiere Total TLS / Advanced Certificate Manager en el panel de Cloudflare, o poner el registro en «DNS only» (el origen ya tiene su certificado válido).

## Verificación

```bash
pnpm typecheck
pnpm lint
pnpm build
```
