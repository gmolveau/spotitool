// PKCE helpers (RFC 7636). All crypto runs in the browser via Web Crypto.

/**
 * Base64url-encode raw bytes (no padding), per the PKCE spec.
 * @param {ArrayBuffer | Uint8Array} bytes
 * @returns {string}
 */
function base64url(bytes) {
	const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (const b of arr) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a high-entropy code verifier (~86 chars, within the 43–128 range).
 * @returns {string}
 */
export function createVerifier() {
	const random = new Uint8Array(64);
	crypto.getRandomValues(random);
	return base64url(random);
}

/**
 * Derive the S256 code challenge from a verifier.
 * @param {string} verifier
 * @returns {Promise<string>}
 */
export async function challengeFromVerifier(verifier) {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return base64url(digest);
}

/**
 * A short random string for the OAuth `state` (CSRF) parameter.
 * @returns {string}
 */
export function createState() {
	const random = new Uint8Array(16);
	crypto.getRandomValues(random);
	return base64url(random);
}
