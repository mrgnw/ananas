// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Error {}
	interface Locals {
		user: {
			id: string;
			username: string;
			created_at: number;
		} | null;
	}
	// interface PageData {}
	interface Platform {
		env?: {
			DB: D1Database;
		};
	}
}

/// <reference types="@cloudflare/workers-types" />
