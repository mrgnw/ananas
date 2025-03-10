import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	host: '0.0.0.0',
	resolve: {
		alias: {
			// Provide an empty polyfill for Node.js built-ins
			child_process: './src/lib/polyfills/empty.js',
			crypto: './src/lib/polyfills/crypto-polyfill.js'
		}
	},
	build: {
		// Tell Vite not to try to resolve these modules
		rollupOptions: {
			external: ['child_process']
		}
	}
});
