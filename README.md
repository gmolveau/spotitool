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

## Spotify API limitations (Development mode)

By default, every app you create in the Spotify Developer Dashboard starts in
**Development mode**. This is a hard constraint from Spotify — not a limitation
of SpotiTool — and it shapes how this app can be used:

- **5-user allowlist.** Only Spotify accounts you explicitly add under
  *Settings → User Management* can authenticate against the app. The list is
  capped at **5 users**, and each must be added by name **and** email exactly
  as they appear on the user's Spotify profile. Anyone not on the list gets an
  auth error and cannot sign in.
- **You are user #1.** The account that owns the app (the developer) can always
  use it. That is why SpotiTool works out of the box for you without touching
  the allowlist.
- **No public distribution.** A Development-mode app cannot be opened up to the
  general public. To lift the 5-user cap you must apply for **Extended Quota
  mode**, and Spotify's review has requirements that a personal, single-user
  tool generally cannot (and does not need to) meet — e.g. a registered
  business/organization, a commercial use case, branding and privacy-policy
  compliance. SpotiTool is intentionally a personal tool and stays in
  Development mode.
- **Lower rate limits.** Development-mode apps get a smaller rolling-window rate
  limit than Extended Quota apps. For a single user this is rarely hit, but bulk
  operations (e.g. unfollowing many artists) are batched partly for this reason.
- **Deprecated endpoints stay deprecated.** Some Web API endpoints Spotify has
  restricted (e.g. audio-features, related-artists, recommendations) are
  unavailable to newly created apps regardless of mode — Development mode does
  not grant access to them.

**Practical takeaway:** SpotiTool is designed as a *single-user* tool. Run it
with your own Spotify Developer app, and you never touch the allowlist. If you
want a friend to use it, either add them (up to 4 others) to your app's User
Management list, or have them create their own Spotify app and Client ID.

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
