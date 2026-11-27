# Guardians Predictions - Datos y backups

Persistencia de los contenedores y operaciones de backup y restore.

## Datos

| Ruta o volumen | Entornos | Contenido |
| --- | --- | --- |
| `data/postgres` | production | Datos de Postgres (bind mount) |
| `pgdata` (volumen) | development, localhost | Datos de Postgres |
| `socialpredict_uploads` (volumen) | todos | Archivos subidos, compartidos sociales |
| `data/nginx/vhosts/` | todos | Templates de nginx |
| `data/traefik/config/` | production | `traefik.yaml` renderizado y `acme.json` |
| `data/traefik/logs/` | production | Logs de Traefik |
| `backups/` (directorio hermano del repo) | todos | Backups de base de datos |

`./SocialPredict down` usa `-v`:

- elimina `socialpredict_uploads` en todos los entornos;
- elimina `pgdata` en development y localhost;
- elimina `socialpredict_dev_node_modules` en development;
- conserva `data/postgres` en producción.

Los uploads no sobreviven a `down`. Antes de bajar el stack en producción conviene copiar el volumen:

```
docker run --rm -v socialpredict_uploads:/data -v "$PWD/../backups:/backup" alpine tar czf /backup/uploads.tar.gz -C /data .
```

## Backups de base de datos

```
./SocialPredict backup --save
./SocialPredict backup --list
./SocialPredict backup --latest
./SocialPredict backup --restore <archivo>
./SocialPredict backup --restore-latest
./SocialPredict backup --inspect <archivo>
./SocialPredict backup --help
```

| Aspecto | Detalle |
| --- | --- |
| Destino | `../backups/`, hermano del repo |
| Nombre | `socialpredict_backup_<APP_ENV>_<timestamp>.dump.gz` |
| Checksum | mismo nombre con extensión `.sha256` |
| Formato | `pg_dump` comprimido con gzip |
| Requisito | contenedor de Postgres del stack activo corriendo |

`--restore` y `--restore-latest` piden confirmación antes de tocar la base.

`--inspect` muestra owners, privilegios y extensiones del dump sin restaurar.

## Acceso directo a la base

```
./SocialPredict exec postgres psql -U user -d socialpredict_db
```

Los valores salen de `POSTGRES_USER` y `POSTGRES_DATABASE` en `.env`.
