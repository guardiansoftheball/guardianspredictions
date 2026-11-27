# Guardians Predictions - Configuración

`.env`, perfiles de rate limit y `JWT_SIGNING_KEY`.

## .env

`./SocialPredict install` copia `.env.example` a `.env` y escribe los valores de cada entorno. `.env` está en `.gitignore` y no se versiona.

`install` con flags (`-e`, `-d`, `-m`, `-r`, `--tls-mode`) trabaja en modo `FORCE=y`: recrea `.env` desde `.env.example` y borra `data/postgres`. Los valores escritos a mano en `.env` se pierden.

Variables principales:

| Variable | Uso |
| --- | --- |
| `APP_ENV` | `development`, `localhost` o `production`; define el compose activo |
| `BACKEND_IMAGE_NAME` | Tag de la imagen de backend |
| `FRONTEND_IMAGE_NAME` | Tag de la imagen de frontend |
| `BACKEND_CONTAINER_NAME` | Nombre del contenedor de backend en development y localhost |
| `FRONTEND_CONTAINER_NAME` | Nombre del contenedor de frontend |
| `POSTGRES_CONTAINER_NAME` | Nombre del contenedor de Postgres |
| `NGINX_CONTAINER_NAME` | Nombre del contenedor de nginx |
| `TRAEFIK_CONTAINER_NAME` | Nombre del contenedor de Traefik (producción) |
| `BACKEND_PORT` | Puerto de backend, 8080 |
| `FRONTEND_PORT` | Puerto de frontend, 5173 |
| `DB_PORT` | Puerto de Postgres, 5432 |
| `NGINX_PORT` | Puerto de nginx, 80 |
| `DOMAIN` | Dominio o IP pública |
| `DOMAIN_URL` | URL pública con esquema |
| `API_URL` | URL pública de la API |
| `PUBLIC_BASE_URL` | URL base para metadata y sharing |
| `TLS_MODE` | `https` o `http` en producción; ver [certificados SSL](./GUARDIANS-SSL.md) |
| `SECURITY_FRAME_ANCESTORS` | Política de embebido en iframes |
| `SHARE_SITE_NAME` | Nombre del sitio en las tarjetas de sharing |
| `SHARE_DEFAULT_IMAGE_URL` | Imagen por defecto de las tarjetas de sharing |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | Credenciales de Postgres |
| `DB_REQUIRE_TLS`, `DB_SSLMODE` | TLS hacia Postgres; en el despliegue empaquetado queda `false` y `disable` |
| `ADMIN_PASSWORD` | Password inicial del usuario `admin` |
| `JWT_SIGNING_KEY` | Clave de firma de tokens |
| `RATE_LIMIT_*` | Límites de login y API |
| `BUILD_NATIVE_ARM64`, `FORCE_PLATFORM` | Plataforma de build; ver [imágenes](./GUARDIANS-IMAGENES.md#arquitectura) |

`.env.example` es la lista completa de variables y trae los valores por defecto.

## Rate limit

`install` escribe los valores `RATE_LIMIT_*` en `.env`.

| Perfil | Login (req/s) | Login burst | API (req/s) | API burst | Cleanup |
| --- | --- | --- | --- | --- | --- |
| `secure-default` | 0.1 | 3 | 1 | 10 | 5m |
| `small-droplet-staging` | 5 | 20 | 25 | 50 | 5m |
| `loadtest` | 100 | 200 | 1000 | 2000 | 5m |
| `env-file` | toma `RATE_LIMIT_*` del entorno del shell | | | | |
| `custom` | pregunta cada valor | | | | |

Los perfiles se aplican con `-r PERFIL` o con la variable `RATE_LIMIT_PROFILE`. Los overlays de `deploy/env/` se cargan por `source` antes de ejecutar `install`.

Ejemplo con overlay:

```
source deploy/env/.env.staging
./SocialPredict install -e production -d ejemplo.com -m ops@ejemplo.com
```

## JWT

`install` genera `JWT_SIGNING_KEY` y lo persiste en `.env`.

- Si `.env` ya tiene `JWT_SIGNING_KEY`, se reutiliza y los tokens emitidos siguen siendo válidos.
- La lectura de la clave existente usa `python3` o `python`; sin intérprete el instalador genera una clave nueva en cada corrida y los tokens anteriores dejan de validar.
- Entregar `.env` en el backup del host evita regenerar la clave.
