import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// SPA mode: no SSR, everything served from a static fallback shell.
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			// GitHub Pages project site lives under /spotitool.
			base: process.env.BASE_PATH ?? '/spotitool'
		}
	}
};

export default config;
