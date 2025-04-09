// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

/// <reference types="@cloudflare/workers-types" />

declare namespace App {
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	interface Platform {
		env: {
			DB: D1Database;
		};
		context: {
			waitUntil(promise: Promise<any>): void;
		};
		cache: Cache;
	}
}

export {};
