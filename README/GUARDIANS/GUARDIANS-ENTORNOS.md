# Guardians Predictions - Entornos

Los tres entornos del despliegue: `development`, `localhost` y `production`.

`APP_ENV` en `.env` define el compose activo. Las opciones de `install` están en [comandos](./GUARDIANS-COMANDOS.md#install).

## development

```
./SocialPredict install -e development
./SocialPredict up
```

- Contenedores: `db`, `backend`, `frontend`.
- Red: `socialpredict_dev_network`.
- El código se monta por bind: `backend/` en `/src` y `frontend/` en `/app`.
- Backend con hot reload (Air), frontend con Vite (`npm run start`).
- `DOMAIN_URL=http://localhost` y la API queda en `http://localhost:8080`.
- Base de datos en el volumen nombrado `pgdata`.
- Acceso: `http://localhost:5173`.
- Usuarios de prueba: `./SocialPredict dev-bootstrap-users`.
- `.env` usa los tags `:dev`.

## localhost

```
./SocialPredict install -e localhost
./SocialPredict up
```

- Contenedores: `db`, `backend`, `frontend`, `webserver`.
- Red: `socialpredict_network`.
- Imágenes de producción construidas en el host con tags `:localhost`.
- nginx publica el puerto 80 y enruta las rutas listadas en [red y puertos](./GUARDIANS-RED-PUERTOS.md#rutas-de-nginx).
- Base de datos en el volumen nombrado `pgdata`.
- `scripts/docker-compose.override.yml` fija la plataforma de `backend`, `frontend` y `db`.
- Acceso: `http://localhost`.

## production

```
./SocialPredict install -e production -d ejemplo.com -m ops@ejemplo.com
./SocialPredict up
```

Modo interactivo equivalente:

```
./SocialPredict install
# menú: Production
```

- Contenedores: `db`, `backend-startup-writer`, `backend`, `frontend`, `webserver`, `traefik`.
- Redes: `socialpredict_internal_network` para los servicios y `socialpredict_external_network` para `webserver` y `traefik`.
- `backend-startup-writer` corre con `STARTUP_WRITER=true`, aplica migraciones y seeds, y queda healthy antes de que arranque `backend`.
- `backend` corre con `STARTUP_WRITER=false` y espera `/readyz` del writer.
- Postgres no publica puertos al host; los datos viven en `data/postgres`.
- nginx no publica puertos al host; Traefik lo alcanza por la red externa con la regla `Host(DOMAIN)`.
- Traefik publica 80 y 443. Con `TLS_MODE=https` redirige 80 a 443 y emite el certificado con Let's Encrypt; con `TLS_MODE=http` publica todo por 80. Detalle en [certificados SSL](./GUARDIANS-SSL.md).
- `install` imprime usuario `admin` y password generado. El password queda en `.env` como `ADMIN_PASSWORD`.
- `.env` usa los tags `:production`.
- Acceso: `https://<DOMAIN>` o `http://<DOMAIN>` según `TLS_MODE`.

## Cambio de entorno en un host

`install` con flags corre en modo `FORCE=y`: recrea `.env` y borra `data/postgres`. En un host con datos de producción, cambiar de entorno implica perder esa base.

Para conservar los datos, el backup previo está en [datos y backups](./GUARDIANS-DATOS-BACKUPS.md).
