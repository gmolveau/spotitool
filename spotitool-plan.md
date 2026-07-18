# SpotiTool — Design Handoff

A personal, single-user web app: a "power tools" **Suite** for managing one's own
Spotify account. First (and only, for the MVP) **Tool**: **Followed Artists** —
review the artists you follow and bulk-unfollow the ones you no longer want.

Grilling session resolved the full design tree. This file captures every decision
so a fresh session can start implementing immediately.

---

## Locked decisions

| Area                    | Decision                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shape**               | Frontend-only SvelteKit SPA, **no backend**                                                                                                          |
| **Persistence**         | None — Spotify is the sole source of truth; data held in memory only                                                                                 |
| **Spotify auth**        | Authorization Code + **PKCE** (public client, no client secret)                                                                                      |
| **Scopes**              | `user-follow-read` (list), `user-follow-modify` (unfollow)                                                                                           |
| **Session**             | Refresh token in `localStorage` + **silent refresh** (stay signed in across reloads/restarts)                                                        |
| **Scope**               | Power-tools **Suite** vision; MVP = **Followed Artists** Tool only. Keep UI trivially extensible for future tools, but don't build a suite shell yet |
| **Followed Artists UX** | Fetch-**all**-upfront → client-side search / A–Z sort / genre-filter → multi-select checkboxes → **confirm** → batched `DELETE`s of 50 ids           |
| **Accepted constraint** | Spotify exposes **no "date followed" / listening-recency** signal → pruning is a manual visual scan (search + genre filter are the main aids)        |
| **Deploy**              | `@sveltejs/adapter-static`, SSR off, `fallback: '404.html'`; **GitHub Pages subpath** project site with `kit.paths.base = '/spotitool'`              |
| **Redirect URIs**       | `http://127.0.0.1:5173/callback` (dev) + `https://<you>.github.io/spotitool/callback` (prod) — register both in Spotify dashboard                    |
| **Callback**            | Client-side SPA route (`/callback`); PKCE token exchange runs in the browser                                                                         |

---

## Spotify Web API notes (Followed Artists)

- **List:** `GET /v1/me/following?type=artist&limit=50` — **cursor-paginated** (`after=<last artist id>`), max 50/page. Returns artist name, images, genres, popularity, follower count, external URL.
- **Unfollow:** `DELETE /v1/me/following?type=artist&ids=<comma-separated>` — up to **50 ids per request**; batch selections.
- Web API supports **CORS** → call directly from the browser.
- The `accounts.spotify.com` token endpoint also supports CORS → refresh from the browser.
- **Client ID is public** (fine to ship in browser JS). Spotify requires HTTPS redirect URIs except loopback `http://127.0.0.1`; the `localhost` hostname is deprecated for this — use `127.0.0.1`.

---

## Implementation to-do (fresh session)

1. **`git init`** + commit the current scaffold (repo is NOT under git yet — deletions are otherwise irreversible; scaffold is regenerable via copier `.copier-answers.yml`).
2. **Strip the dead server side:** `backend/`, `keycloak/`, `compose*.yml`, root `.env` machinery.
3. When (2) is done, mark **ADR-0002** (`docs/adr/0002-...`) as `deprecated` — it documents backend API-key auth that no longer exists.
4. **`svelte.config.js`:** swap `adapter-node` → `@sveltejs/adapter-static`; set `fallback: '404.html'`, `kit.paths.base = '/spotitool'`. Add `export const ssr = false` (SPA mode).
5. **Spotify app:** create it in the dashboard, grab Client ID, register the two redirect URIs above.
6. **Auth module:** PKCE flow (generate verifier/challenge, redirect to authorize, `/callback` exchanges code → tokens, store refresh token in `localStorage`, silent refresh on load).
7. **Followed Artists tool:** fetch-all pager → in-memory list → search/sort/genre-filter → multi-select → confirm dialog → batched unfollow.
8. Respect the AGENTS.md workflow: `just format` + `just checks` before committing `.ts`/`.svelte`/`.html` changes (frontend `just checks` = ESLint).

---

## Security posture (accepted, low risk for a personal tool)

- Refresh token in `localStorage` is XSS-stealable. Acceptable: single user, no third-party scripts, no user-generated content on the page. Revisit if the suite ever embeds untrusted code.

---

## Docs already written in the repo

- **`CONTEXT.md`** — glossary: _Suite_, _Tool_, _Followed Artists_, _Follow/Unfollow_, _Spotify Session_.
- **`docs/adr/0003-frontend-only-spa-direct-to-spotify.md`** — the architecture decision, options considered, consequences.
