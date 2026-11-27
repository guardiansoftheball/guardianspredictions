# Guardians Predictions - Host y archivos

Requisitos del host y mapa de archivos del despliegue en servidor único.

## Requisitos

- Linux x86_64 o arm64 con Docker Engine y Compose v2 (`docker compose version`).
- `bash`, `git`, `envsubst` (paquete `gettext`), `curl`, `python3`.
- Salida a Docker Hub para bajar las imágenes base durante el build.
- Puertos libres según el entorno: ver [red y puertos](./GUARDIANS-RED-PUERTOS.md).
- Disco para imágenes, datos de Postgres, uploads y cache de build.
- Memoria: el build del frontend ejecuta `npm ci` y `vite build`; con 2 GB de RAM el host termina el build, con menos conviene agregar swap.

`python3` lo usa `scripts/lib/jwt_key.sh` para reutilizar `JWT_SIGNING_KEY` entre instalaciones. Sin `python3` el instalador genera una clave nueva en cada corrida.

## Archivos del repo

| Ruta | Rol |
| --- | --- |
| `SocialPredict` | Wrapper de comandos y ayuda |
| `scripts/install.sh` | Genera `.env`, credenciales, configuración de Traefik y construye las imágenes |
| `scripts/docker-commands.sh` | `up`, `build`, `down`, `exec`, `logs`, `cleanup` |
| `scripts/lib/arch.sh` | Selección de plataforma de build en hosts arm64 |
| `scripts/lib/jwt_key.sh` | Generación y persistencia de `JWT_SIGNING_KEY` |
| `scripts/docker-compose-dev.yaml` | Topología de desarrollo |
| `scripts/docker-compose-local.yaml` | Topología local con nginx |
| `scripts/docker-compose-prod.yaml` | Topología de producción con Traefik |
| `docker/backend/Dockerfile` | Imagen de backend para localhost y producción |
| `docker/backend/Dockerfile.dev` | Imagen de backend para desarrollo |
| `docker/frontend/Dockerfile` | Imagen de frontend para localhost y producción |
| `docker/frontend/Dockerfile.dev` | Imagen de frontend para desarrollo |
| `data/nginx/vhosts/dev/` | Template de nginx para desarrollo |
| `data/nginx/vhosts/prod/` | Template de nginx para localhost y producción |
| `data/traefik/config/traefik.template` | Template de Traefik con TLS y Let's Encrypt |
| `data/traefik/config/traefik-http.template` | Template de Traefik solo HTTP |
| `deploy/env/` | Overlays de rate limit por entorno |
| `loadtest/fixtures/` | CSV generados por `load seed` |

## Directorios de datos

| Ruta | Contenido |
| --- | --- |
| `data/postgres/` | Datos de Postgres en producción (bind mount) |
| `data/nginx/vhosts/` | Templates de nginx por entorno |
| `data/traefik/config/` | `traefik.yaml` renderizado y `acme.json` |
| `data/traefik/logs/` | `error.log` de Traefik |
| `../backups/` | Backups de base de datos, hermano del repo |

`data/traefik/config/traefik.yaml` y `data/traefik/config/acme.json` están en `.gitignore` y se generan en el host.
