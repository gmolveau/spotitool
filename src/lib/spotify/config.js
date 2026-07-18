import { base } from '$app/paths';

/**
 * The Spotify application's Client ID. Public by design — this is a PKCE public
 * client, so there is no secret to protect. Set VITE_SPOTIFY_CLIENT_ID in `.env`.
 * @type {string}
 */
export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';

/** Scopes: read the followed-artists list, and modify (unfollow) it. */
export const SCOPES = ['user-follow-read', 'user-follow-modify'];

export const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
export const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
export const API_BASE = 'https://api.spotify.com/v1';

/**
 * The redirect URI, derived from where the app is actually running so it stays
 * correct in both dev (http://127.0.0.1:5173/spotitool/callback) and prod
 * (https://<you>.github.io/spotitool/callback). Register both in the Spotify
 * dashboard exactly as printed by the connect screen.
 * @returns {string}
 */
export function redirectUri() {
	return `${window.location.origin}${base}/callback`;
}
