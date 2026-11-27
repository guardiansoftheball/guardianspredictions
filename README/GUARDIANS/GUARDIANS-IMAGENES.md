# Guardians Predictions - Imágenes

Nombres, tags, construcción y arquitectura de las imágenes de la aplicación.

## Nombres y tags

Cada entorno usa un tag propio. Los nombres quedan escritos en `.env` por `./SocialPredict install`.

| Entorno | Backend | Frontend | Dockerfile |
| --- | --- | --- | --- |
| development | `guardianspredictions-backend:dev` | `guardianspredictions-frontend:dev` | `docker/*/Dockerfile.dev` |
| localhost | `guardianspredictions-backend:localhost` | `guardianspredictions-frontend:localhost` | `docker/*/Dockerfile` |
| production | `guardianspredictions-backend:production` | `guardianspredictions-frontend:production` | `docker/*/Dockerfile` |

`.env.example` trae `guardianspredictions-backend:production` y `guardianspredictions-frontend:production` como valores iniciales.

Tags separados por entorno permiten cambiar `APP_ENV` en un mismo host sin pisar la imagen anterior.

## Construcción

- Los tres compose declaran la sección `build` de `backend` y `frontend`, con contexto en la raíz del repo.
- Los servicios de la aplicación declaran `pull_policy: never`.
- `./SocialPredict install` construye las imágenes al final del proceso.
- `./SocialPredict build` reconstruye las imágenes del entorno activo.
- `./SocialPredict build --no-cache` reconstruye sin cache de Docker.
- `./SocialPredict up --build` reconstruye y levanta en un solo paso.
- `./SocialPredict up` levanta con las imágenes existentes; si falta alguna imagen, Compose la construye.

La cache de Docker se reutiliza entre builds. `npm ci` y `go mod download` se repiten solo cuando cambian los manifiestos.

Imágenes presentes en el host:

```
docker images "guardianspredictions-*"
```

## Imágenes base

| Imagen | Uso |
| --- | --- |
| `golang:1.26.4-alpine3.22` | Builder del backend |
| `alpine:3.24.1` | Runtime del backend |
| `node:26.3.0-alpine3.22` | Builder del frontend, runtime de desarrollo del frontend |
| `nginx:1.29.3-alpine3.22` | Runtime del frontend en localhost y producción |
| `nginx:latest` | Servicio `webserver` en localhost y producción |
| `postgres:16.6-alpine` | Base de datos en development y localhost |
| `postgres:16.6-alpine3.20` | Base de datos en producción |
| `traefik:v3.6.1` | Borde público en producción |

## Arquitectura

El build del backend usa el argumento `TARGETARCH` que provee BuildKit (`GOARCH` del binario Go). En hosts x86_64 el binario queda amd64; en hosts arm64 queda arm64.

Variables relacionadas en `.env`:

- `BUILD_NATIVE_ARM64=true`: en host arm64 construye imágenes arm64 nativas.
- `BUILD_NATIVE_ARM64=false`: en host arm64 construye imágenes amd64 bajo emulación (valor por defecto).
- `FORCE_PLATFORM`: plataforma que `arch.sh` exporta para los comandos de Docker; se puede fijar a mano (`linux/amd64` o `linux/arm64`).

En el entorno `localhost` el instalador además escribe `scripts/docker-compose.override.yml` con la plataforma fijada para `backend`, `frontend` y `db`. Ese archivo está en `.gitignore` y se regenera en cada instalación.
