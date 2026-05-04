# Server & Infrastructure Notes

## Linux Home Server (almari)
- Production repo: `~/home_server/playground` (main branch)
- Staging repo: `~/home_server/staging` (staging branch)
- OS: Linux

## Docker
- Compose file lives in the production repo folder
- Containers: `playground-nginx-1`, `playground-nginx-staging-1`, `playground-cloudflared-1`, `playground-umami-1`, `playground-umami-db-1`

## Cloudflare
- Tunnel name: `home-server`
- Tunnel ID: `7152d93c-b09b-48c3-b7f2-13ea67e2a60e`
- Production hostname: `saniajamil.com → http://nginx:80`
- Staging hostname: `staging.saniajamil.com → http://nginx-staging:80`
- Analytics hostname: `analytics.saniajamil.com → http://umami:3000`

## Common commands
```bash
# Restart nginx after config change
docker exec playground-nginx-1 nginx -s reload

# Bring up all containers
cd ~/home_server/playground
docker compose up -d

# Check logs
docker logs playground-nginx-1 --tail 20
docker logs playground-cloudflared-1 --tail 10
docker logs playground-umami-1 --tail 20
```
