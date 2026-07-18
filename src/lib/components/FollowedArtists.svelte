<script>
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fetchAllFollowedArtists, unfollowArtists } from '$lib/spotify/api.js';

	/** @typedef {import('$lib/spotify/api.js').Artist} Artist */

	/** @type {Artist[]} */
	let artists = $state([]);
	let loading = $state(true);
	let loadProgress = $state({ loaded: 0, total: 0 });
	let error = $state('');

	// Filters / sort
	let query = $state('');
	let genreFilter = $state('');
	/** @type {'default' | 'az' | 'za'} */
	let sort = $state('default');

	// Selection (artist ids marked for unfollow)
	const selected = new SvelteSet();

	// Confirm + unfollow lifecycle
	let confirming = $state(false);
	let unfollowing = $state(false);
	let unfollowProgress = $state({ done: 0, total: 0 });

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			artists = await fetchAllFollowedArtists((loaded, total) => {
				loadProgress = { loaded, total };
			});
		} catch (/** @type {any} */ e) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	const genres = $derived.by(() => {
		const set = new Set();
		for (const a of artists) for (const g of a.genres) set.add(g);
		return [...set].sort((a, b) => a.localeCompare(b));
	});

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		let list = artists.filter((a) => {
			if (q && !a.name.toLowerCase().includes(q)) return false;
			if (genreFilter && !a.genres.includes(genreFilter)) return false;
			return true;
		});
		if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
		else if (sort === 'za') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
		return list;
	});

	const allFilteredSelected = $derived(
		filtered.length > 0 && filtered.every((a) => selected.has(a.id))
	);

	/** @param {string} id */
	function toggle(id) {
		if (selected.has(id)) selected.delete(id);
		else selected.add(id);
	}

	function toggleAllFiltered() {
		if (allFilteredSelected) {
			for (const a of filtered) selected.delete(a.id);
		} else {
			for (const a of filtered) selected.add(a.id);
		}
	}

	function clearSelection() {
		selected.clear();
	}

	async function confirmUnfollow() {
		const ids = [...selected];
		unfollowing = true;
		unfollowProgress = { done: 0, total: ids.length };
		error = '';
		try {
			await unfollowArtists(ids, (done, total) => {
				unfollowProgress = { done, total };
			});
			const removed = new Set(ids);
			artists = artists.filter((a) => !removed.has(a.id));
			selected.clear();
			confirming = false;
		} catch (/** @type {any} */ e) {
			error = e?.message ?? String(e);
		} finally {
			unfollowing = false;
		}
	}

	/** @param {Artist} a */
	function thumb(a) {
		return a.images?.at(-1)?.url ?? a.images?.[0]?.url ?? '';
	}
</script>

<div class="tool">
	<header class="tool-head">
		<h1>Followed Artists</h1>
		{#if !loading && !error}
			<span class="count">{artists.length} followed</span>
		{/if}
	</header>

	{#if loading}
		<p class="status">
			Loading your followed artists… {loadProgress.loaded}{#if loadProgress.total}
				/ {loadProgress.total}{/if}
		</p>
	{:else if error && artists.length === 0}
		<div class="status error">
			<p>{error}</p>
			<button class="ghost" onclick={load}>Retry</button>
		</div>
	{:else if artists.length === 0}
		<p class="status">You don't follow any artists.</p>
	{:else}
		<div class="controls">
			<input
				type="search"
				placeholder="Search by name…"
				bind:value={query}
				aria-label="Search artists by name"
			/>
			<select bind:value={genreFilter} aria-label="Filter by genre">
				<option value="">All genres</option>
				{#each genres as g (g)}
					<option value={g}>{g}</option>
				{/each}
			</select>
			<select bind:value={sort} aria-label="Sort order">
				<option value="default">Spotify order</option>
				<option value="az">Name A–Z</option>
				<option value="za">Name Z–A</option>
			</select>
		</div>

		<div class="bulkbar">
			<label class="selectall">
				<input
					type="checkbox"
					checked={allFilteredSelected}
					onchange={toggleAllFiltered}
					aria-label="Select all shown"
				/>
				Select all shown ({filtered.length})
			</label>
			<div class="spacer"></div>
			{#if selected.size > 0}
				<span class="selcount">{selected.size} selected</span>
				<button class="ghost" onclick={clearSelection}>Clear</button>
				<button class="danger" onclick={() => (confirming = true)}>
					Unfollow {selected.size}
				</button>
			{/if}
		</div>

		{#if error}
			<p class="status error inline">{error}</p>
		{/if}

		{#if filtered.length === 0}
			<p class="status">No artists match your filters.</p>
		{:else}
			<ul class="grid">
				{#each filtered as a (a.id)}
					<li class="artist" class:selected={selected.has(a.id)}>
						<label>
							<input type="checkbox" checked={selected.has(a.id)} onchange={() => toggle(a.id)} />
							{#if thumb(a)}
								<img src={thumb(a)} alt="" loading="lazy" />
							{:else}
								<span class="noimg" aria-hidden="true"></span>
							{/if}
							<span class="meta">
								<span class="name">{a.name}</span>
								{#if a.genres.length}
									<span class="genres">{a.genres.slice(0, 3).join(' · ')}</span>
								{/if}
							</span>
						</label>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

{#if confirming}
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		tabindex="-1"
	>
		<div class="modal">
			<h2 id="confirm-title">Unfollow {selected.size} artist{selected.size === 1 ? '' : 's'}?</h2>
			<p class="muted">This immediately unfollows them on Spotify. It cannot be undone here.</p>
			{#if unfollowing}
				<p class="status">Unfollowing… {unfollowProgress.done} / {unfollowProgress.total}</p>
			{/if}
			{#if error}
				<p class="status error">{error}</p>
			{/if}
			<div class="modal-actions">
				<button class="ghost" onclick={() => (confirming = false)} disabled={unfollowing}>
					Cancel
				</button>
				<button class="danger" onclick={confirmUnfollow} disabled={unfollowing}>
					{unfollowing ? 'Unfollowing…' : `Unfollow ${selected.size}`}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.tool-head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.tool-head h1 {
		margin: 0.25rem 0 1rem;
	}

	.count {
		color: var(--text-dim);
	}

	.status {
		color: var(--text-dim);
		margin: 1.5rem 0;
	}

	.status.inline {
		margin: 0.5rem 0;
	}

	.status.error {
		color: var(--danger);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
	}

	.controls input[type='search'] {
		flex: 1 1 220px;
	}

	.bulkbar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		padding: 0.5rem 0.25rem;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 3.4rem;
		background: var(--bg);
		z-index: 5;
	}

	.selectall {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-dim);
		cursor: pointer;
	}

	.spacer {
		flex: 1;
	}

	.selcount {
		color: var(--text);
		font-weight: 600;
	}

	.grid {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.5rem;
	}

	.artist label {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.5rem 0.6rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
	}

	.artist.selected label {
		border-color: var(--danger);
		background: color-mix(in srgb, var(--danger) 12%, var(--surface));
	}

	.artist img,
	.artist .noimg {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--surface-2);
	}

	.meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.genres {
		font-size: 0.78rem;
		color: var(--text-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 50;
	}

	.modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.5rem;
		max-width: 420px;
		width: 100%;
	}

	.modal h2 {
		margin-top: 0;
	}

	.muted {
		color: var(--text-dim);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 1.25rem;
	}
</style>
