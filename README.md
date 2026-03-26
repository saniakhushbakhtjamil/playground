# saniajamil.com

Personal portfolio and project feed. Live at [saniajamil.com](https://saniajamil.com).

## Stack

- Static HTML/CSS — no frameworks
- Nginx (Docker) — serves the files
- Cloudflare Tunnel — public access without port forwarding
- GitHub Actions (self-hosted runner) — auto-deploys on push to `main`

## CI/CD Pipeline

```mermaid
sequenceDiagram
    participant You as You (Mac)
    participant GitHub
    participant Runner as GitHub Actions Runner (Windows)
    participant Docker as Docker (Windows)
    participant CF as Cloudflare
    participant Visitor

    You->>GitHub: git push origin main
    GitHub->>Runner: trigger deploy job
    Runner->>Runner: git pull origin main
    Runner->>Docker: docker compose restart nginx
    Docker->>Docker: nginx reloads with new files

    Visitor->>CF: visits saniajamil.com
    CF->>Docker: routes via Cloudflare Tunnel
    Docker->>Visitor: serves portfolio
```

## Local development

Open `index.html` in your browser.
