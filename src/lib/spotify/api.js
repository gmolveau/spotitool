import { auth } from '$lib/spotify/auth.svelte.js';
import { API_BASE } from '$lib/spotify/config.js';

/**
 * @typedef {Object} Artist
 * @property {string} id
 * @property {string} name
 * @property {string[]} genres
 * @property {number} popularity
 * @property {{ url: string, width: number, height: number }[]} images
 * @property {{ total: number }} followers
 * @property {{ spotify: string }} external_urls
 */

/**
 * Authenticated fetch against the Spotify Web API, with automatic token refresh
 * and 429 (rate-limit) back-off + retry.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function apiFetch(path, options = {}) {
	const token = await auth.ensureFreshToken();
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: { Authorization: `Bearer ${token}`, ...options.headers }
	});

	if (res.status === 429) {
		const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
		await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
		return apiFetch(path, options);
	}
	if (!res.ok) {
		throw new Error(`Spotify API error (${res.status}): ${await res.text()}`);
	}
	// Some endpoints (e.g. DELETE /me/library) reply 200 with an empty body.
	const text = await res.text();
	return text ? JSON.parse(text) : null;
}

/**
 * Fetch the full followed-artists list up front, walking the cursor pagination.
 * @param {(loaded: number, total: number) => void} [onProgress]
 * @returns {Promise<Artist[]>}
 */
export async function fetchAllFollowedArtists(onProgress) {
	/** @type {Artist[]} */
	const artists = [];
	/** @type {string | null} */
	let after = null;

	do {
		const query = new URLSearchParams({ type: 'artist', limit: '50' });
		if (after) query.set('after', after);
		const data = await apiFetch(`/me/following?${query}`);
		artists.push(...data.artists.items.map((a) => ({ ...a, genres: a.genres ?? [] })));
		after = data.artists.cursors?.after ?? null;
		onProgress?.(artists.length, data.artists.total ?? artists.length);
	} while (after);

	return artists;
}

/**
 * Unfollow artists in batches of 50 (the API's per-request cap).
 *
 * Uses the generic library endpoint (`DELETE /me/library` with `spotify:artist:`
 * URIs). The old artist-specific `DELETE /me/following` endpoint was removed for
 * Development Mode apps in the February 2026 Web API changes and returns 403.
 * @param {string[]} ids
 * @param {(done: number, total: number) => void} [onProgress]
 */
export async function unfollowArtists(ids, onProgress) {
	for (let i = 0; i < ids.length; i += 50) {
		const batch = ids.slice(i, i + 50);
		const uris = batch.map((id) => `spotify:artist:${id}`).join(',');
		await apiFetch(`/me/library?uris=${encodeURIComponent(uris)}`, { method: 'DELETE' });
		onProgress?.(Math.min(i + 50, ids.length), ids.length);
	}
}
