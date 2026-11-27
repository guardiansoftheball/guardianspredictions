# Guardians Predictions - Comandos

Cada comando del wrapper `./SocialPredict` con sus opciones.

## Notas generales

- Todos los comandos se ejecutan desde la raíz del repo.
- El wrapper valida `docker compose`, carga `.env` e imprime `Using compose file: <ruta>`.
- Excepto `help`, los comandos requieren `.env` generado por `install`.
- `./SocialPredict <comando> --help` muestra la ayuda de los comandos con opciones.

## install

```
./SocialPredict install
./SocialPredict install -e ENTORNO [-d DOMINIO_IP] [-m EMAIL] [-r PERFIL] [--tls-mode MODO]
```

Sin argumentos abre el menú interactivo: `Development`, `Localhost`, `Production`, `Quit`. En ese modo pregunta si recrear `.env` y si borrar `data/postgres`.

| Opción | Descripción |
| --- | --- |
| `-e development\|localhost\|production` | Entorno a preparar (obligatorio con flags) |
| `-d DOMINIO_IP` | Dominio o IP pública; obligatorio para `production` |
| `-m EMAIL` | Email para Let's Encrypt; obligatorio para `production` con `--tls-mode https` |
| `-r PERFIL` | Perfil de rate limit |
| `--tls-mode https\|http` (`-t`) | Modo del borde público en `production` |
| `--help`, `-h` | Ayuda |

El modo con flags usa `FORCE=y`: recrea `.env` desde `.env.example`, borra `data/postgres` y, si el stack está corriendo, ejecuta `down -v`.

Pasos por entorno:

- `development`: escribe `APP_ENV`, `DOMAIN`, `DOMAIN_URL`, `PUBLIC_BASE_URL`, tags de imagen `:dev`, perfil de rate limit `secure-default`, `JWT_SIGNING_KEY` y construye las imágenes.
- `localhost`: escribe lo mismo que development con `APP_ENV=localhost`, `API_URL=http://localhost/api`, tags `:localhost`, escribe el override de plataforma y construye las imágenes.
- `production`: pide dominio, modo TLS y email; renderiza `data/traefik/config/traefik.yaml` desde el template; aplica el perfil de rate limit; escribe `DB_REQUIRE_TLS=false`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, `JWT_SIGNING_KEY` y tags `:production`; construye las imágenes y muestra las credenciales de `admin`.

## build

```
./SocialPredict build [--no-cache]
```

Construye `backend` y `frontend` con el compose del `APP_ENV` activo.

| Opción | Descripción |
| --- | --- |
| `--no-cache` | Ignora la cache de Docker |
| `--help`, `-h` | Ayuda |

## up

```
./SocialPredict up [--build]
```

Levanta el stack del `APP_ENV` activo en modo detached. En `production` crea la red `socialpredict_external_network` si no existe y crea `data/traefik/config/acme.json` con permisos `600` si no existe.

| Opción | Descripción |
| --- | --- |
| `--build` | Reconstruye las imágenes de la aplicación antes de levantar |
| `--help`, `-h` | Ayuda |

## down

```
./SocialPredict down
```

Baja el stack con `docker compose down -v`. Los volúmenes nombrados se eliminan: `socialpredict_uploads` en todos los entornos, `pgdata` en development y localhost, y `socialpredict_dev_node_modules` en development. En producción los datos de Postgres viven en `data/postgres` (bind mount) y sobreviven a `down`.

## exec

```
./SocialPredict exec <servicio> [comando]
```

Abre shell o ejecuta un comando en un contenedor.

| Servicio | Contenedor |
| --- | --- |
| `nginx` | Servicio `webserver` |
| `backend` | Servicio `backend` |
| `frontend` | Servicio `frontend` |
| `postgres`, `db` | Servicio `db` |

Sin comando abre `/bin/sh`. Con `/bin/bash` o `/bin/sh` abre la shell indicada. Cualquier otro comando se ejecuta con `docker exec -i`. Si el nombre fijo del `.env` no está corriendo, el comando resuelve el contenedor por servicio de Compose.

Ejemplos:

```
./SocialPredict exec backend
./SocialPredict exec backend wget -qO- http://127.0.0.1:8080/health
./SocialPredict exec postgres psql -U user -d socialpredict_db
./SocialPredict exec nginx nginx -t
```

## logs

```
./SocialPredict logs [objetivo] [-f|--follow]
```

Sin argumento lista los servicios del compose activo y sus contenedores.

| Objetivo | Descripción |
| --- | --- |
| `<servicio>` | Logs de un servicio (`db`, `backend`, `backend-startup-writer`, `frontend`, `webserver`, `traefik`) |
| `<nombre-contenedor>` | Logs por nombre de contenedor del compose activo |
| `options`, `list` | Lista de objetivos disponibles |
| `all` | Logs agregados de todo el stack |
| `-f`, `--follow` | Sigue la salida |

`backend-startup-writer` y `traefik` existen solo en producción.

## backup

```
./SocialPredict backup [opción]
```

Opera sobre la base de datos del stack activo. Los archivos quedan en el directorio hermano del repo, `../backups/`.

| Opción | Descripción |
| --- | --- |
| `--save` | Crea `socialpredict_backup_<APP_ENV>_<timestamp>.dump.gz` con su `.sha256` |
| `--list` | Lista los backups, del más nuevo al más viejo |
| `--latest` | Imprime la ruta del backup más nuevo |
| `--restore <archivo>` | Restaura un `.dump.gz` con confirmación |
| `--restore-latest` | Restaura el backup más nuevo con confirmación |
| `--inspect <archivo>` | Muestra owners, privilegios y extensiones del dump |
| `--help` | Ayuda |

Detalle en [datos y backups](./GUARDIANS-DATOS-BACKUPS.md).

## cleanup

```
./SocialPredict cleanup docker [opciones]
```

Limpia artefactos de Docker del host. Funciona sin `.env`.

| Opción | Descripción |
| --- | --- |
| (sin opciones) | Elimina contenedores detenidos, imágenes colgantes y cache de build |
| `--all-images` | Elimina todas las imágenes sin uso |
| `--volumes` | Elimina volúmenes sin uso |
| `--help` | Ayuda |

`./SocialPredict build` vuelve a construir las imágenes que `cleanup` haya eliminado; el próximo build tarda lo que dura un build completo.

## load

```
LOAD_TEST_ENABLED=true ./SocialPredict load seed [opciones]
./SocialPredict load help
```

Crea usuarios, moderadores y mercados de prueba. Requiere `LOAD_TEST_ENABLED=true`. Con `APP_ENV=production` requiere además `LOAD_TEST_ALLOW_PRODUCTION=true`.

| Opción | Descripción |
| --- | --- |
| `--users N` | Usuarios regulares, 1 a 50000 (default 10) |
| `--moderators N` | Moderadores, 1 a 10000 (default 2) |
| `--markets N` | Mercados publicados, 1 a 50000 (default 5) |
| `--hot-markets N` | Mercados marcados como hot en `markets.csv` (default 1) |
| `--password VALOR` | Password de todos los usuarios (default `loadtest-password`) |
| `--user-prefix VALOR` | Prefijo de usuarios regulares (default `loaduser`) |
| `--moderator-prefix VALOR` | Prefijo de moderadores (default `loadmod`) |
| `--user-balance N` | Balance inicial de cada usuario (default 1000000) |
| `--resolution-days N` | Días hasta la resolución de los mercados, 1 a 3650 |
| `--bcrypt-cost N` | Costo del hash de password, 4 a 31 |
| `--reset` | Borra usuarios, mercados y apuestas con prefijo antes de crear |
| `--help` | Ayuda |

Los CSV de fixtures quedan en `loadtest/fixtures/`.

## dev-bootstrap-users

```
./SocialPredict dev-bootstrap-users [opciones]
```

Crea usuarios de login para desarrollo. Requiere `APP_ENV=development` y el contenedor de backend corriendo.

| Opción | Descripción |
| --- | --- |
| `--password VALOR` | Password de los usuarios (default `password`) |
| `--count N` | Cantidad de usuarios regulares, 1 a 100 (default 10) |
| `--prefix VALOR` | Prefijo de usuarios (default `testuser`) |
| `--help` | Ayuda |

Usuarios creados: `admin` (ADMIN), `testuser01` (MODERATOR dueño de los mercados fixture), `testuser02` en adelante (REGULAR). Mercados fixture: `Market A`, `Market B`, `Market C`, publicados y a cargo de `testuser01`.

## help

```
./SocialPredict help
./SocialPredict --help
./SocialPredict <comando> --help
```
