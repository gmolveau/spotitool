import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Spotify requires the loopback IP (127.0.0.1), not the deprecated `localhost`.
		host: '127.0.0.1',
		port: 5173
	}
});
