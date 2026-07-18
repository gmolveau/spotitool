<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { auth } from '$lib/spotify/auth.svelte.js';

	let error = $state('');

	onMount(async () => {
		try {
			await auth.handleCallback(page.url.searchParams);
			await goto(`${base}/`, { replaceState: true });
		} catch (/** @type {any} */ e) {
			error = e?.message ?? String(e);
		}
	});
</script>

<section class="card">
	{#if error}
		<h1>Couldn't connect</h1>
		<p class="err">{error}</p>
		<a href="{base}/">← Back to start</a>
	{:else}
		<h1>Connecting…</h1>
		<p class="muted">Completing sign-in with Spotify.</p>
	{/if}
</section>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 2rem;
		margin-top: 2rem;
		text-align: center;
	}

	.muted {
		color: var(--text-dim);
	}

	.err {
		color: var(--danger);
		word-break: break-word;
	}
</style>
