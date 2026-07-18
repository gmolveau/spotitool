<script>
	import { auth } from '$lib/spotify/auth.svelte.js';
	import { CLIENT_ID, redirectUri } from '$lib/spotify/config.js';
	import FollowedArtists from '$lib/components/FollowedArtists.svelte';

	let currentRedirect = $state('');
	$effect(() => {
		currentRedirect = redirectUri();
	});
</script>

{#if !CLIENT_ID}
	<section class="card warn">
		<h1>Configuration needed</h1>
		<p>
			No Spotify Client ID found. Create an app in the
			<a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer"
				>Spotify Developer Dashboard</a
			>, then set <code>VITE_SPOTIFY_CLIENT_ID</code> in a <code>.env</code> file and restart the dev
			server.
		</p>
		<p class="muted">Register this redirect URI in the dashboard:</p>
		<code class="redirect">{currentRedirect}</code>
	</section>
{:else if auth.isAuthenticated}
	<FollowedArtists />
{:else}
	<section class="card hero">
		<h1>Followed Artists</h1>
		<p>Review the artists you follow on Spotify and bulk-unfollow the ones you no longer want.</p>
		<button class="primary" onclick={() => auth.login()}>Connect Spotify</button>
		<p class="muted small">
			Uses Authorization Code + PKCE. Only <code>user-follow-read</code> and
			<code>user-follow-modify</code> are requested. Nothing is stored on a server.
		</p>
		<details>
			<summary>Redirect URI to register</summary>
			<code class="redirect">{currentRedirect}</code>
		</details>
	</section>
{/if}

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 2rem;
		margin-top: 2rem;
	}

	.hero {
		text-align: center;
	}

	.hero h1 {
		margin-top: 0;
	}

	.hero button.primary {
		margin: 0.5rem 0 1rem;
		font-size: 1.05rem;
		padding: 0.7rem 1.6rem;
	}

	.warn {
		border-color: var(--danger);
	}

	.muted {
		color: var(--text-dim);
	}

	.small {
		font-size: 0.85rem;
	}

	.redirect {
		display: inline-block;
		margin-top: 0.4rem;
		padding: 0.4rem 0.6rem;
		background: var(--surface-2);
		border-radius: 6px;
		word-break: break-all;
	}

	details {
		margin-top: 1.25rem;
		color: var(--text-dim);
		font-size: 0.85rem;
	}

	summary {
		cursor: pointer;
	}
</style>
