// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

/// <reference types="@cloudflare/workers-types" />

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type * as schema from '$lib/server/schema';

declare namespace App {
	// interface Error {}
	interface Locals {
		db: DrizzleD1Database<typeof schema>;
		user: typeof schema.users.$inferSelect | null; // Or define a specific User type
	}
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
