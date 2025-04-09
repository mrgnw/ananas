import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// See https://kit.svelte.dev/docs/adapter-cloudflare#options
			platformProxy: {
				configPath: 'wrangler.json',
				persist: true
			}
		}),
		alias: {
			"$jibs": './src/jibs',
			"$utils": "$lib/utils",
			"@/*": "./src/lib/*",
			"$lib/*": "./src/lib/*"
		}
	},

	preprocess: [vitePreprocess({})]
};

export default config;
