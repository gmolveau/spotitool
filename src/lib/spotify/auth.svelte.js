import { browser } from '$app/environment';
import {
	AUTHORIZE_ENDPOINT,
	CLIENT_ID,
	SCOPES,
	TOKEN_ENDPOINT,
	redirectUri
} from '$lib/spotify/config.js';
import { challengeFromVerifier, createState, createVerifier } from '$lib/spotify/pkce.js';

const LS_REFRESH = 'spotitool.refresh_token';
const SS_VERIFIER = 'spotitool.pkce_verifier';
const SS_STATE = 'spotitool.auth_state';

/**
 * Owns the Spotify session: PKCE login, the /callback token exchange, silent
 * refresh, and logout. The access token lives only in memory; the refresh token
 * persists in localStorage so the session survives reloads and restarts.
 */
class Auth {
	/** @type {string | null} */
	accessToken = $state(null);
	/** epoch ms at which the access token should be treated as expired */
	#expiresAt = 0;
	/** @type {string | null} */
	refreshToken = $state(browser ? localStorage.getItem(LS_REFRESH) : null);
	/** @type {string | null} */
	error = $state(null);

	/** Whether we have (or can obtain) a usable access token. */
	get isAuthenticated() {
		return Boolean(this.accessToken || this.refreshToken);
	}

	/**
	 * @param {{ access_token: string, expires_in: number, refresh_token?: string }} data
	 */
	#applyTokens(data) {
		this.accessToken = data.access_token;
		// Refresh a minute early to avoid racing expiry mid-request.
		this.#expiresAt = Date.now() + (data.expires_in - 60) * 1000;
		if (data.refresh_token) {
			this.refreshToken = data.refresh_token;
			localStorage.setItem(LS_REFRESH, data.refresh_token);
		}
		this.error = null;
	}

	/** Kick off the Authorization Code + PKCE flow (navigates away). */
	async login() {
		const verifier = createVerifier();
		const state = createState();
		sessionStorage.setItem(SS_VERIFIER, verifier);
		sessionStorage.setItem(SS_STATE, state);

		const params = new URLSearchParams({
			client_id: CLIENT_ID,
			response_type: 'code',
			redirect_uri: redirectUri(),
			scope: SCOPES.join(' '),
			code_challenge_method: 'S256',
			code_challenge: await challengeFromVerifier(verifier),
			state
		});
		window.location.assign(`${AUTHORIZE_ENDPOINT}?${params}`);
	}

	/**
	 * Complete the flow on the /callback route: validate state and exchange the
	 * authorization code for tokens.
	 * @param {URLSearchParams} searchParams
	 */
	async handleCallback(searchParams) {
		const err = searchParams.get('error');
		if (err) throw new Error(`Spotify authorization failed: ${err}`);

		const code = searchParams.get('code');
		const returnedState = searchParams.get('state');
		const storedState = sessionStorage.getItem(SS_STATE);
		const verifier = sessionStorage.getItem(SS_VERIFIER);

		if (!code) throw new Error('Missing authorization code in callback.');
		if (!storedState || storedState !== returnedState) {
			throw new Error('State mismatch — possible CSRF. Please try connecting again.');
		}
		if (!verifier) throw new Error('Missing PKCE verifier. Please try connecting again.');

		const body = new URLSearchParams({
			client_id: CLIENT_ID,
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri(),
			code_verifier: verifier
		});

		const res = await fetch(TOKEN_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});
		if (!res.ok) {
			throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
		}
		this.#applyTokens(await res.json());
		sessionStorage.removeItem(SS_VERIFIER);
		sessionStorage.removeItem(SS_STATE);
	}

	/** Exchange the stored refresh token for a fresh access token. */
	async refresh() {
		if (!this.refreshToken) throw new Error('No refresh token available.');
		const body = new URLSearchParams({
			client_id: CLIENT_ID,
			grant_type: 'refresh_token',
			refresh_token: this.refreshToken
		});
		const res = await fetch(TOKEN_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});
		if (!res.ok) {
			// A rejected refresh token is unrecoverable — drop the session.
			this.logout();
			throw new Error(`Session expired. Please connect again. (${res.status})`);
		}
		this.#applyTokens(await res.json());
	}

	/**
	 * Return a valid access token, refreshing silently if needed.
	 * @returns {Promise<string>}
	 */
	async ensureFreshToken() {
		if (this.accessToken && Date.now() < this.#expiresAt) return this.accessToken;
		await this.refresh();
		if (!this.accessToken) throw new Error('Unable to obtain an access token.');
		return this.accessToken;
	}

	logout() {
		this.accessToken = null;
		this.#expiresAt = 0;
		this.refreshToken = null;
		if (browser) localStorage.removeItem(LS_REFRESH);
	}
}

export const auth = new Auth();
