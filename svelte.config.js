import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			 // The Cloudflare adapter doesn't have a cloudflareCompatibility option
			// We can only specify external modules that shouldn't be bundled
			external: ['child_process']
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
