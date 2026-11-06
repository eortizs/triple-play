# Despliegue en VPS — triple-play

Runbook operativo de la aplicación en la VPS. La spec funcional vive en `overview.md`; este documento cubre infraestructura, redes y operación.

## Arquitectura

```
Internet
   │
   ▼
Cloudflare (proxy) ── solo triple-play.people-ia.com
   │
   ▼
Caddy (contenedor agente-caddy-1, puertos 80/443 del host)
   │  Caddyfile: /root/agente/Caddyfile
   ├── skeleton.triple-play.people-ia.com ──► 172.18.0.1:3300  (DNS only, TLS de Caddy)
   └── triple-play.people-ia.com ──────────► 172.18.0.1:3400  (proxied, TLS Cloudflare→Caddy)
   │
   ▼ (host, systemd)
triple-play-skeleton.service    next start :3300  .next-skeleton     (mock JSON)
triple-play-production.service  next start :3400  .next-production   (PostgreSQL skeletor)
   │
   ▼
PostgreSQL localhost:5432 (host) — base `skeletor`, rol `admin`
```

## Componentes y rutas

| Componente | Ruta |
| --- | --- |
| App (repo) | `/home/skeletor/tenants/triple-play` |
| Servicios systemd | `/etc/systemd/system/triple-play-skeleton.service`, `/etc/systemd/system/triple-play-production.service` |
| Ingress (Caddy) | `/root/agente/Caddyfile` (contenedor `agente-caddy-1`, compose en `/root/agente`) |
| Credenciales producción | `/home/skeletor/tenants/triple-play/.env.production` (no versionado) |
| Token Cloudflare (solo API DNS) | `/root/.env` — nunca imprimir ni commitear |
| Esquema/semilla DB | `db/schema.sql` del repo |

## Builds: por qué dos artefactos

`NEXT_PUBLIC_*` se inlinea en el bundle en tiempo de build, así que cada modo necesita su propio build y su propio `distDir` (`next.config.ts` lee `NEXT_DIST_DIR`):

```bash
cd /home/skeletor/tenants/triple-play

# skeleton (maquetación con mocks)
NEXT_PUBLIC_ENVIRONMENT_MODE=skeleton NEXT_DIST_DIR=.next-skeleton pnpm build

# producción (PostgreSQL)
NEXT_PUBLIC_ENVIRONMENT_MODE=production NEXT_DIST_DIR=.next-production pnpm build
```

Ojo: `.env.local` (skeleton) tiene prioridad sobre `.env.production` en Next; por eso el modo se fuerza siempre por variable de proceso en el build y en las units de systemd.

## Redesplegar

```bash
# 1. Pull + builds
git pull
NEXT_PUBLIC_ENVIRONMENT_MODE=skeleton NEXT_DIST_DIR=.next-skeleton pnpm build
NEXT_PUBLIC_ENVIRONMENT_MODE=production NEXT_DIST_DIR=.next-production pnpm build

# 2. Reiniciar servicios (cero downtime percibido: restart ~1s)
systemctl restart triple-play-skeleton triple-play-production

# 3. Verificar
systemctl is-active triple-play-skeleton triple-play-production
curl -s -o /dev/null -w '%{http_code}\n' https://skeleton.triple-play.people-ia.com/login
curl -s -o /dev/null -w '%{http_code}\n' https://triple-play.people-ia.com/login
```

## Operación diaria

```bash
systemctl status triple-play-skeleton triple-play-production
journalctl -u triple-play-production -f        # logs de producción
journalctl -u triple-play-skeleton -n 100      # últimas líneas de skeleton

# Recargar Caddy tras editar /root/agente/Caddyfile (sin reiniciar contenedor):
docker exec agente-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec agente-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

## DNS y SSL

| Hostname | Proxy Cloudflare | TLS servido por |
| --- | --- | --- |
| `triple-play.people-ia.com` | sí (nube naranja) | Cloudflare edge → Caddy (origin) |
| `skeleton.triple-play.people-ia.com` | **no** («DNS only») | Caddy (Let's Encrypt vía ACME automático) |

¿Por qué `skeleton` va en DNS only? El certificado **Universal SSL** gratuito de Cloudflare cubre `*.people-ia.com` (un solo nivel de subdominio). `skeleton.triple-play…` tiene dos niveles, y Cloudflare rechaza el handshake en el edge (`sslv3 alert handshake failure`, alerta 40) antes de llegar al origen. La alternativa de pago es **Total TLS** o **Advanced Certificate Manager** (wildcard `*.triple-play.people-ia.com`); si se contrata, se puede revertir con `proxied: true` en el registro.

Los certificados de origen los emite y renueva Caddy automáticamente (ACME HTTP-01; los dominios pasan por Cloudflare en modo proxy o resuelven directo, ambos sirven el challenge).

### Cambiar el modo proxy de un registro (API)

```bash
set -a; source /root/.env; set +a
ZID=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=people-ia.com" | jq -r '.result[0].id')
# Listar registros para obtener el id
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records?name=skeleton.triple-play.people-ia.com"
# DNS only / proxied
curl -s -X PATCH -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" -d '{"proxied": false}' \
  "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records/<RECORD_ID>"
```

## Firewall (ufw)

Política INPUT por defecto `DROP`; cada puerto host que usa Caddy como upstream necesita allowlist desde las redes docker (`172.16.0.0/12`):

```bash
ufw allow from 172.16.0.0/12 to any port 3300 proto tcp comment 'triple-play skeleton desde containers'
ufw allow from 172.16.0.0/12 to any port 3400 proto tcp comment 'triple-play produccion desde containers'
ufw status numbered
```

## PostgreSQL

- Servidor: `localhost:5432` (servicio host, no el contenedor `tvbox-postgres`).
- Base: `skeletor` · rol: `admin` (credenciales en `.env.production`).
- Esquema + semilla: `psql -h localhost -U admin -d skeletor -f db/schema.sql` (idempotente: `CREATE ... IF NOT EXISTS` + `ON CONFLICT DO NOTHING`).

## Troubleshooting

| Síntoma | Causa probable | Diagnóstico / fix |
| --- | --- | --- |
| **525** desde Cloudflare | Origen no completa handshake TLS | Verifica que Caddy tenga cert para el host: `docker logs agente-caddy-1 \| grep tls.obtain` |
| **502** vía Caddy | Upstream inalcanzable | `docker logs agente-caddy-1 \| grep 'dial tcp'`; si es timeout → regla ufw del puerto (ver sección Firewall) |
| **Alerta 40 / handshake failure** en un sub-subdominio | Universal SSL de Cloudflare no cubre ese nivel | Poner el registro en DNS only o contratar Total TLS/ACM |
| Login falla solo en producción | BD caída o semilla ausente | `systemctl status postgresql`; `psql -h localhost -U admin -d skeletor -c 'SELECT count(*) FROM usuarios'` |
| La app de producción responde como mock | `.env.local` ganó al build/runtime | Rebuild y units fuerzan `NEXT_PUBLIC_ENVIRONMENT_MODE` por proceso; no confiar en archivos `.env` para el modo |

## Puertos usados en el host

| Puerto | Servicio |
| --- | --- |
| 80/443 | Caddy (contenedor `agente-caddy-1`) |
| 3000 | eve api (existente) |
| 3010 | distribuidor-tvbox (existente) |
| 3100/5173 | rakazo (existente) |
| 3300 | **triple-play skeleton** |
| 3400 | **triple-play producción** |
| 5432 | PostgreSQL host |
