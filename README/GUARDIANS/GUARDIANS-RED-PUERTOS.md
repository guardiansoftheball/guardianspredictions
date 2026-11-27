# Guardians Predictions - Red y puertos

Puertos publicados, redes de Docker y rutas que publica nginx.

## Puertos

| Entorno | Servicio | Host | Contenedor |
| --- | --- | --- | --- |
| development | `db` | `${DB_PORT}` (5432) | 5432 |
| development | `backend` | `${BACKEND_PORT}` (8080) | 8080 |
| development | `frontend` | `${FRONTEND_PORT}` (5173) | 5173 |
| localhost | `db` | `${DB_PORT}` (5432) | 5432 |
| localhost | `backend` | `${BACKEND_PORT}` (8080) | 8080 |
| localhost | `frontend` | `${FRONTEND_PORT}` (5173) | 5173 |
| localhost | `webserver` | `${NGINX_PORT}` (80) | 80 |
| production | `traefik` | 80 y 443 | 80 y 443 |
| production | `db`, `backend-startup-writer`, `backend`, `frontend`, `webserver` | sin publicación | interno |

Los valores salen de `.env`. En producción el único servicio con puertos publicados es `traefik`.

Con `TLS_MODE=http` el puerto 443 queda publicado sin servicio TLS detrás; el tráfico entra por 80.

## Redes

| Entorno | Red | Tipo | Servicios |
| --- | --- | --- | --- |
| development | `socialpredict_dev_network` | bridge de compose | `db`, `backend`, `frontend` |
| localhost | `socialpredict_network` | bridge de compose | `db`, `backend`, `frontend`, `webserver` |
| production | `socialpredict_internal_network` | bridge de compose | `db`, `backend-startup-writer`, `backend`, `frontend`, `webserver` |
| production | `socialpredict_external_network` | externa | `webserver`, `traefik` |

`./SocialPredict up` crea `socialpredict_external_network` si no existe.

## Rutas de nginx

Aplican a `localhost` y `production`.

| Ruta | Destino |
| --- | --- |
| `/health` | `backend:8080/health` |
| `/readyz` | `backend:8080/readyz` |
| `/ops/status` | `backend:8080/ops/status` |
| `/openapi.yaml` | `backend:8080/openapi.yaml` |
| `/swagger`, `/swagger/` | `backend:8080` |
| `/api/` | `backend:8080/` |
| `/markets/<id>` | `backend:8080` (metadata Open Graph) |
| `/` | `frontend:80` |

En producción Traefik termina TLS y reenvía HTTP a `webserver` por la red externa. El router usa la regla `Host(${DOMAIN})` y el label `traefik.enable=true` del servicio `webserver`.
