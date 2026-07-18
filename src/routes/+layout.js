// Frontend-only SPA: no SSR, no prerender. Everything runs in the browser and is
// served from the static fallback shell (see svelte.config.js).
export const ssr = false;
export const prerender = false;
