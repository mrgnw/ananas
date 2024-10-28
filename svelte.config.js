import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';
import dotenv from 'dotenv';

dotenv.config();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			"$lib": "./src/lib",
			"$jibs": "./src/jibs",
			"$utils": "./src/lib/utils",
			"@/*": "./src/*"
		}
	},

	preprocess: [vitePreprocess({})]
};

export default config;
