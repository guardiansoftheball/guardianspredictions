# Guardians Predictions - Certificados SSL

TLS del borde público en producción: modos, emisión con Let's Encrypt, renovación y cambios en un host con datos.

## Modos del borde público

`TLS_MODE` en `.env` define el borde:

| `TLS_MODE` | Template de origen | Puertos con servicio | Certificado |
| --- | --- | --- | --- |
| `https` (default) | `data/traefik/config/traefik.template` | 80 (redirección) y 443 | Let's Encrypt para `DOMAIN` |
| `http` | `data/traefik/config/traefik-http.template` | 80 | ninguno |

Se elige con `--tls-mode` al instalar:

```
./SocialPredict install -e production -d ejemplo.com -m ops@ejemplo.com --tls-mode https
./SocialPredict install -e production -d 203.0.113.10 --tls-mode http
```

## Generación de la configuración

`install` renderiza `data/traefik/config/traefik.yaml` con `envsubst` desde el template del modo elegido.

- El archivo queda montado en el contenedor como `/etc/traefik/traefik.yml:ro`.
- `traefik.yaml` está en `.gitignore` y se regenera en cada instalación.
- El email de Let's Encrypt queda escrito dentro de `traefik.yaml`; `.env` no guarda `EMAIL`.
- `TLS_MODE` se escribe en `.env`.

## Emisión con Let's Encrypt

El template de `https` define:

| Elemento | Valor |
| --- | --- |
| Entrypoint `web` | `:80`, redirige a `websecure` con esquema `https` |
| Entrypoint `websecure` | `:443`, `asDefault: true`, `certresolver: letsencrypt` |
| Resolver `letsencrypt` | `acme-v02.api.letsencrypt.org/directory` |
| Storage ACME | `/acme.json` |
| Desafío | `httpChallenge` por el entrypoint `web` |

Secuencia:

1. Traefik levanta `web` y `websecure` y lee del provider Docker el label `traefik.enable=true` de `webserver` con la regla `Host(DOMAIN)`.
2. Con ese dominio, el resolver `letsencrypt` pide el certificado a Let's Encrypt por HTTP-01.
3. Let's Encrypt consulta `http://DOMAIN/.well-known/acme-challenge/<token>`, que Traefik responde por el entrypoint `web`.
4. El certificado y la cuenta ACME quedan en `acme.json`.
5. Traefik termina TLS y reenvía HTTP a `webserver` por `socialpredict_external_network`; nginx escucha en 80 dentro de la red.

El certificado cubre exactamente el valor de `DOMAIN`. Con `DOMAIN=www.ejemplo.com` el certificado es para `www.ejemplo.com`; el dominio sin `www` necesita otra entrada en el router.

## Requisitos para emitir

- `DOMAIN` con registro A (o AAAA) apuntando a la IP pública del host.
- Puertos 80 y 443 abiertos en el firewall y en el security group del proveedor.
- Ningún otro proceso escuchando 80 ni 443 en el host.
- Email válido en `-m`: Let's Encrypt lo usa para avisos de expiración.
- Salida a internet hacia `acme-v02.api.letsencrypt.org`.

Verificación del DNS antes de instalar:

```
dig +short ejemplo.com
getent hosts ejemplo.com
```

## Archivo acme.json

| Elemento | Valor |
| --- | --- |
| Ruta en el host | `data/traefik/config/acme.json` |
| Ruta en el contenedor | `/acme.json` |
| `storage` en `traefik.yaml` | `/acme.json` |
| Permisos | `600` |

- `./SocialPredict up` crea el archivo con `600` si no existe.
- Traefik rechaza el archivo con otros permisos y no emite certificados.
- Contiene la cuenta ACME y los certificados emitidos: conviene incluirlo en el backup del host.
- Está en `.gitignore` y no se versiona.

## Renovación

Traefik renueva solo, sin reiniciar el contenedor. Los certificados de Let's Encrypt duran 90 días y la renovación arranca 30 días antes del vencimiento.

Estado del certificado en uso:

```
echo | openssl s_client -connect ejemplo.com:443 -servername ejemplo.com 2>/dev/null | openssl x509 -noout -subject -dates
```

Dominios registrados en el storage:

```
sudo python3 -m json.tool data/traefik/config/acme.json | head -n 40
```

Errores de ACME:

```
./SocialPredict logs traefik
tail -f data/traefik/logs/error.log
```

## Forzar una emisión nueva

Para un dominio nuevo, un certificado vencido o una cuenta ACME inválida:

```
./SocialPredict down
sudo rm -f data/traefik/config/acme.json
./SocialPredict up
curl -I https://ejemplo.com
```

`up` recrea `acme.json` con permisos `600`. La emisión arranca cuando Traefik carga la configuración de Docker; si el DNS todavía no resolvía, se reintenta en los siguientes arranques o al recargar la configuración.

Let's Encrypt limita los certificados duplicados a 5 por semana por dominio. Para probar el flujo conviene el entorno de staging:

```
sed -i 's|acme-v02.api.letsencrypt.org|acme-staging-v02.api.letsencrypt.org|' data/traefik/config/traefik.yaml
docker restart socialpredict-traefik-container
```

Los certificados de staging no son confiables para navegadores. Para volver a producción, borrar `acme.json`, restaurar el `caServer` de producción en `traefik.yaml` y reiniciar Traefik.

## Cambiar TLS_MODE o el email en un host con datos

`install` con flags corre en modo `FORCE=y` y borra `data/postgres`. En un host con datos, el template se renderiza a mano:

```
# https
EMAIL=ops@ejemplo.com envsubst < data/traefik/config/traefik.template > data/traefik/config/traefik.yaml

# http
envsubst < data/traefik/config/traefik-http.template > data/traefik/config/traefik.yaml
```

Después se ajustan `TLS_MODE`, `DOMAIN`, `DOMAIN_URL`, `API_URL` y `PUBLIC_BASE_URL` en `.env`, y se recrean los contenedores que consumen esos valores:

```
docker compose --env-file .env -f scripts/docker-compose-prod.yaml up -d --force-recreate traefik webserver backend frontend
```

`entryPoints` y `certificatesResolvers` son configuración estática: Traefik los toma al arrancar. Un reinicio alcanza cuando solo cambió `traefik.yaml`:

```
docker restart socialpredict-traefik-container
```

Al cambiar `DOMAIN`, el router pide un certificado nuevo para el dominio nuevo y el anterior deja de usarse.

## TLS terminado fuera del host (túnel cloudflared)

Caso: Cloudflare termina TLS en un subdominio propio y entrega HTTP al host por un túnel. Let's Encrypt no participa: el desafío HTTP-01 no llega al host porque el subdominio no apunta a su IP.

```
./SocialPredict install -e production -d dev-predict.guardiansid.io --tls-mode http
```

- `--tls-mode http` renderiza `traefik-http.template`: entrypoint `:80` como default, sin `websecure`, sin `certificatesResolvers` y sin redirección.
- `-m` no hace falta.
- `DOMAIN` tiene que ser el subdominio público: el router de Traefik usa `Host(DOMAIN)` y el túnel reenvía ese Host.

`install` escribe las URLs públicas con esquema `http://`. Detrás del túnel la URL real es `https://`, así que se corrigen antes de levantar:

```
sed -i "s|^DOMAIN_URL=.*|DOMAIN_URL='https://dev-predict.guardiansid.io'|" .env
sed -i "s|^API_URL=.*|API_URL=https://dev-predict.guardiansid.io/api|" .env
sed -i "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL='https://dev-predict.guardiansid.io'|" .env
```

El contenedor de frontend escribe `window.__ENV__.API_URL` como `${DOMAIN_URL}/api` al arrancar; con `http://` el navegador bloquea las llamadas por contenido mixto. `TLS_MODE=http` se mantiene: solo controla el borde de Traefik.

Si el túnel propaga `X-Forwarded-For` con la IP del cliente, el rate limit puede identificar clientes por esa IP:

```
echo "TRUST_PROXY_HEADERS=true" >> .env
```

Ingress del túnel:

```yaml
tunnel: <UUID>
credentials-file: /home/<user>/.cloudflared/<UUID>.json

ingress:
  - hostname: dev-predict.guardiansid.io
    service: http://localhost:80
  - service: http_status:404
```

```
cloudflared tunnel route dns <nombre-del-tunel> dev-predict.guardiansid.io
cloudflared tunnel run <nombre-del-tunel>
```

cloudflared conserva el `Host` original. Si se fija `httpHostHeader`, tiene que coincidir con `DOMAIN`.

Verificación local con el Host del subdominio:

```
curl -sS -H "Host: dev-predict.guardiansid.io" http://127.0.0.1/health
curl -sS -H "Host: dev-predict.guardiansid.io" http://127.0.0.1/readyz
curl -sS -H "Host: dev-predict.guardiansid.io" http://127.0.0.1/env-config.js
```

Un 404 en esas pruebas indica que el `Host` no coincide con `DOMAIN`.

El host no necesita puertos abiertos al público: el túnel inicia la conexión desde el host hacia Cloudflare. Traefik sigue publicando 80 y 443; en modo http el 443 no tiene servicio detrás.

Cambio de subdominio, con el stack ya instalado:

```
sed -i "s|^DOMAIN=.*|DOMAIN='nuevo.ejemplo.com'|" .env
sed -i "s|^DOMAIN_URL=.*|DOMAIN_URL='https://nuevo.ejemplo.com'|" .env
sed -i "s|^API_URL=.*|API_URL=https://nuevo.ejemplo.com/api|" .env
sed -i "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL='https://nuevo.ejemplo.com'|" .env
docker compose --env-file .env -f scripts/docker-compose-prod.yaml up -d --force-recreate webserver backend frontend
```

El template http no depende de `DOMAIN`; el router se arma con el label de `webserver` en el compose, así que Traefik no se toca.

## Redirección y cabeceras

- Con `TLS_MODE=https`, el entrypoint `web` redirige todo a `websecure`. Comprobación: `curl -sI http://ejemplo.com | head -n 5` devuelve el `Location` con `https://`.
- Con `TLS_MODE=http` no hay redirección ni TLS: todo el tráfico va por 80.
- nginx en producción no agrega HSTS ni cabeceras de seguridad.
- El backend emite `Strict-Transport-Security` cuando `SECURITY_HSTS_ENABLED=true`, con `SECURITY_HSTS_MAX_AGE` (default `31536000`), `SECURITY_HSTS_INCLUDE_SUBDOMAINS` y `SECURITY_HSTS_PRELOAD`. Las variables se declaran en `.env`; por defecto HSTS queda desactivado.

## Diagnóstico

TODO
