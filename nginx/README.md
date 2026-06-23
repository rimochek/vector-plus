# Nginx for vector-plus

Nginx runs as the **`nginx`** Docker service (`vector_nginx`) defined in the root [docker-compose.yml](../docker-compose.yml). It terminates HTTPS and proxies:

- `vectorplus.app` / `www.vectorplus.app` → `frontend:3000`
- `api.vectorplus.app` → `backend:5000`

Config: [default.conf](./default.conf)  
SSL certs (required on server, not in git): `./nginx/ssl/origin.crt` and `./nginx/ssl/origin.key`

## SSL certificates (fix restart loop)

If logs show:

```text
cannot load certificate "/etc/nginx/ssl/origin.crt": No such file or directory
```

Nginx will keep restarting until both files exist on the **server** at:

```text
./nginx/ssl/origin.crt
./nginx/ssl/origin.key
```

(relative to `docker-compose.yml`; mounted into the container as `/etc/nginx/ssl/`)

### Cloudflare Origin Certificate (recommended for vectorplus.app)

1. Cloudflare dashboard → **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Hostnames: `vectorplus.app`, `*.vectorplus.app` (covers `www` and `api`)
3. Save the certificate as `origin.crt` and private key as `origin.key`
4. On the server:

```bash
mkdir -p nginx/ssl
nano nginx/ssl/origin.crt   # paste certificate, save
nano nginx/ssl/origin.key   # paste private key, save
chmod 600 nginx/ssl/origin.key
```

5. Upload from your machine instead (optional):

```bash
scp origin.crt user@YOUR_SERVER:/path/to/vector-plus/nginx/ssl/
scp origin.key user@YOUR_SERVER:/path/to/vector-plus/nginx/ssl/
```

6. Restart Nginx:

```bash
docker compose restart nginx
docker compose logs nginx --tail 20
```

Cloudflare SSL mode should be **Full (strict)** when using an origin certificate.

### Verify files before start

```bash
ls -la nginx/ssl/
# must show origin.crt and origin.key

docker run --rm \
  -v "$(pwd)/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$(pwd)/nginx/ssl:/etc/nginx/ssl:ro" \
  nginx:stable-alpine nginx -t
```

## Restart Nginx

From the project root (where `docker-compose.yml` lives):

```bash
docker compose restart nginx
```

Or by container name:

```bash
docker restart vector_nginx
```

## Reload after editing `default.conf`

Prefer reload over restart when only config changed:

```bash
docker exec vector_nginx nginx -t && docker exec vector_nginx nginx -s reload
```

- `nginx -t` — validate config before applying
- `nginx -s reload` — apply config without stopping the container

No image rebuild is needed for config changes; the file is mounted as a volume.

## Restart the whole stack

Use when backend or frontend changed, not just Nginx:

```bash
docker compose down
docker compose up -d
```

## Check status and logs

```bash
docker compose ps nginx
docker compose logs nginx --tail 50
```

## Notes

- Edit `./nginx/default.conf` on the server, then run `nginx -t` and reload.
- Ensure SSL files exist under `./nginx/ssl/` before starting the stack.
- Set `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` in the root `.env` to match your public HTTPS URLs.
