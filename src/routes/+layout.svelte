<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { auth } from '$lib/spotify/auth.svelte.js';

	let { children } = $props();

	let ready = $state(false);

	const onCallback = $derived(page.url.pathname === `${base}/callback`);

	onMount(async () => {
		// Silent refresh on load, so the session survives reloads/restarts.
		// Skip on /callback, which runs its own token exchange.
		if (!onCallback && auth.refreshToken) {
			try {
				await auth.refresh();
			} catch {
				// Stale refresh token was already cleared by auth.refresh().
			}
		}
		ready = true;
	});
</script>

<header class="topbar">
	<a class="brand" href="{base}/">
		<span class="dot" aria-hidden="true"></span>
		SpotiTool
	</a>
	{#if auth.isAuthenticated && !onCallback}
		<button class="ghost" onclick={() => auth.logout()}>Sign out</button>
	{/if}
</header>

<main>
	{#if ready || onCallback}
		{@render children()}
	{:else}
		<p class="loading">Restoring session…</p>
	{/if}
</main>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.25rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--text);
		text-decoration: none;
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--accent);
	}

	main {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 4rem;
	}

	.loading {
		color: var(--text-dim);
		text-align: center;
		margin-top: 3rem;
	}
</style>
