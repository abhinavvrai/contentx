# Publishing Content X

Your complete website code is in this folder. GitHub is your backup and change history; Cloudflare is where the live website runs.

## First-time setup

1. In Cloudflare, create an API token using the **Edit Cloudflare Workers** template.
2. Open `.env.local` in this folder and add one line:

   `CLOUDFLARE_API_TOKEN=paste-your-token-here`

   Keep this file private. It is already excluded from GitHub.

## Publish a change

1. Make your code changes locally or with Codex.
2. Run `npm run deploy:cloudflare` from this folder.
3. Open `https://contentx.co.in/?version=latest` and confirm the change.

The publishing command always makes a clean build first, then deploys it directly to your Cloudflare Worker. This avoids the outdated Cloudflare Build cache that caused the old page to remain visible.
