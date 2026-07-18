# SpotiTool

A personal, single-user web app — a power-tools **Suite** for managing your own
Spotify account. It is a frontend-only SvelteKit SPA with **no backend**: Spotify
is the sole source of truth, and all data is held in memory.

**MVP tool: Followed Artists** — review the artists you follow and bulk-unfollow
the ones you no longer want (search / A–Z sort / genre filter / multi-select /
confirm / batched unfollow).

## How it works

- **Auth:** Authorization Code + **PKCE** (public client, no secret). Scopes:
  `user-follow-read`, `user-follow-modify`.
- **Session:** the refresh token lives in `localStorage`; the access token stays
  in memory. A silent refresh on load keeps you signed in across reloads.
- **Deploy:** `@sveltejs/adapter-static`, SSR off, `fallback: '404.html'`,
  `paths.base = '/spotitool'` (GitHub Pages project site).

## Setup

1. **Create a Spotify app** at the
   [Developer Dashboard](https://developer.spotify.com/dashboard) and copy its
   **Client ID** (public — safe to ship in browser JS).
2. **Register redirect URIs** (both):
   - Dev: `http://127.0.0.1:5173/spotitool/callback`
   - Prod: `https://<you>.github.io/spotitool/callback`

   > Note: because the app is served under the `/spotitool` base path, the
   > callback route includes it. The connect screen prints the exact URI to
   > register for the current environment.

3. **Configure the Client ID:**
   ```sh
   cp .env.example .env
   # set VITE_SPOTIFY_CLIENT_ID=...
   ```

## Develop

```sh
pnpm install
pnpm dev          # http://127.0.0.1:5173/spotitool
```

Use `127.0.0.1`, not `localhost` — Spotify has deprecated the `localhost`
hostname for loopback redirect URIs.

## Checks & build

```sh
pnpm lint         # prettier --check
pnpm check        # svelte-check
pnpm build        # static build into ./build
pnpm preview
```

## Deploy to GitHub Pages

The static build in `./build` is publishable as-is. Set `BASE_PATH` if your
repo/site path differs from `/spotitool`.

## Security posture

The refresh token in `localStorage` is XSS-stealable. Accepted for a single-user
tool with no third-party scripts and no user-generated content on the page.
Revisit if the suite ever embeds untrusted code.
