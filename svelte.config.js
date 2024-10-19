import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';
import dotenv from 'dotenv';

dotenv.config();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			"$jibs": './src/jibs',
			"$utils": "$lib/utils",
			"@/*": "./src/lib/*",
		}
	},

	preprocess: [vitePreprocess({})]
};

export default config;
