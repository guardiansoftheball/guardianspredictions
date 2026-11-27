# Guardians Predictions - Deploy en servidor único

Índice de la documentación del despliegue de este fork (`guardiansoftheball/guardianspredictions`) en un host Linux con Docker.

El repo se opera desde el wrapper `./SocialPredict` en la raíz. Ese wrapper carga `scripts/install.sh` para preparar el entorno y `scripts/docker-commands.sh` para todo lo que pasa después. Las imágenes de la aplicación (`backend`, `frontend`) se construyen en el host a partir del código del checkout; las imágenes base salen de Docker Hub durante la construcción.

## Referencia rápida: producción

Requisitos previos: `DOMAIN` resolviendo a la IP del host y puertos 80 y 443 libres.

### Instalar

```
./SocialPredict install -e production -d ejemplo.com -m ops@ejemplo.com
./SocialPredict up
```

- `-d` dominio público, `-m` email para Let's Encrypt.
- `install` escribe `.env`, genera credenciales, renderiza `data/traefik/config/traefik.yaml` y construye las imágenes.
- Al terminar imprime el usuario `admin` y el password generado, que queda en `.env` como `ADMIN_PASSWORD`.
- Acceso: `https://ejemplo.com`.
- Host temporal con IP pública y sin TLS: `--tls-mode http` y `-d <IP>`.

Detalle: [entornos](./GUARDIANS/GUARDIANS-ENTORNOS.md#production) y [certificados SSL](./GUARDIANS/GUARDIANS-SSL.md).

### Actualizar

```
git pull
./SocialPredict backup --save
./SocialPredict build
./SocialPredict up
```

- `build` reconstruye backend y frontend con el código actual.
- `up` recrea los contenedores cuya imagen o configuración cambió.
- `backend-startup-writer` aplica migraciones y seeds antes de que arranque `backend`.
- `install` no se usa para actualizar: recrea `.env` y borra `data/postgres`.

Detalle: [operación](./GUARDIANS/GUARDIANS-OPERACION.md).

### Detener

```
./SocialPredict down
```

- Baja el stack con `docker compose down -v`.
- `data/postgres` (bind mount) queda en disco: los datos de Postgres se conservan.
- Se elimina el volumen `socialpredict_uploads`: los archivos subidos y los compartidos sociales se pierden.
- Para volver a levantar: `./SocialPredict up`.

Detalle: [datos y backups](./GUARDIANS/GUARDIANS-DATOS-BACKUPS.md).

## Documentos

| Documento | Contenido |
| --- | --- |
| [GUARDIANS-HOST.md](./GUARDIANS/GUARDIANS-HOST.md) | Requisitos del host, archivos del repo y directorios de datos |
| [GUARDIANS-IMAGENES.md](./GUARDIANS/GUARDIANS-IMAGENES.md) | Nombres y tags, construcción, imágenes base y arquitectura |
| [GUARDIANS-CONFIGURACION.md](./GUARDIANS/GUARDIANS-CONFIGURACION.md) | Variables de `.env`, perfiles de rate limit y `JWT_SIGNING_KEY` |
| [GUARDIANS-COMANDOS.md](./GUARDIANS/GUARDIANS-COMANDOS.md) | Cada comando del wrapper con cada opción |
| [GUARDIANS-ENTORNOS.md](./GUARDIANS/GUARDIANS-ENTORNOS.md) | `development`, `localhost` y `production` |
| [GUARDIANS-RED-PUERTOS.md](./GUARDIANS/GUARDIANS-RED-PUERTOS.md) | Puertos publicados, redes y rutas de nginx |
| [GUARDIANS-SSL.md](./GUARDIANS/GUARDIANS-SSL.md) | Certificados Let's Encrypt, `acme.json`, renovación y cambio de modo TLS |
| [GUARDIANS-DATOS-BACKUPS.md](./GUARDIANS/GUARDIANS-DATOS-BACKUPS.md) | Persistencia, backup y restore |
| [GUARDIANS-OPERACION.md](./GUARDIANS/GUARDIANS-OPERACION.md) | Actualización, verificación de salud y recreación de servicios |

## Referencias externas

- [README-INFRA-PRODUCTION.md](./INFRA/README-INFRA-PRODUCTION.md)
- [PRODUCTION-NOTES/BACKEND/08-deployment-infrastructure.md](./PRODUCTION-NOTES/BACKEND/08-deployment-infrastructure.md)
- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
