# Guardians Predictions - Operación

Actualización del despliegue, verificación de salud y recreación de contenedores.

## Actualizar

```
git pull
./SocialPredict backup --save
./SocialPredict build
./SocialPredict up
```

- `git pull` trae el código nuevo al checkout del host.
- `build` reconstruye `backend` y `frontend` con ese código; las imágenes base se reutilizan desde la cache de Docker.
- `up` recrea solo los contenedores cuya imagen o configuración cambió.
- `backend-startup-writer` aplica migraciones y seeds, y `backend` arranca cuando el writer responde `/readyz`.
- `install` no forma parte de la actualización: recrea `.env` y borra `data/postgres`.

Volver a una versión anterior:

```
git checkout <tag-o-commit>
./SocialPredict build
./SocialPredict up
```

Las migraciones ya aplicadas no se revierten con el checkout; restaurar el backup previo cubre ese caso.

## Verificación

```
curl -sS https://ejemplo.com/health
curl -sS https://ejemplo.com/readyz
curl -sS https://ejemplo.com/ops/status
```

| Endpoint | Respuesta |
| --- | --- |
| `/health` | `live` cuando el proceso responde |
| `/readyz` | `ready` cuando el backend terminó el arranque |
| `/ops/status` | estado operativo del backend |

Estado de los contenedores:

```
docker compose --env-file .env -f scripts/docker-compose-prod.yaml ps
```

Healthchecks por contenedor:

```
docker inspect --format '{{.Name}} {{.State.Health.Status}}' $(docker ps -q)
```

## Logs

```
./SocialPredict logs backend -f
./SocialPredict logs backend-startup-writer
./SocialPredict logs traefik
./SocialPredict logs all
```

Traefik escribe además en `data/traefik/logs/error.log`.

## Recrear un servicio

Un cambio en `.env` se aplica recreando los contenedores que leen esas variables:

```
docker compose --env-file .env -f scripts/docker-compose-prod.yaml up -d --force-recreate backend frontend webserver
```

Servicios puntuales:

```
docker compose --env-file .env -f scripts/docker-compose-prod.yaml up -d --force-recreate traefik
```

Un cambio en `data/traefik/config/traefik.yaml` requiere reiniciar Traefik, porque `entryPoints` y `certificatesResolvers` son configuración estática:

```
docker restart socialpredict-traefik-container
```
