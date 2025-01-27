import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/auth': {
				target: 'http://localhost:8787',
				changeOrigin: true
			}
		}
	}
});
