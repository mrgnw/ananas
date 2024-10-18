/// <reference types="@cloudflare/workers-types" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		interface Platform {
			env: {
				PUBLIC_PASSLOCK_TENANCY_ID: string;
				PUBLIC_PASSLOCK_CLIENT_ID: string;
			};
		}
	}
}

export {};
