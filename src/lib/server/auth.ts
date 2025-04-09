import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';

// Assuming db instance is initialized elsewhere and imported
// For Cloudflare D1, initialization often happens per-request in hooks or endpoints
// We might need to adjust this depending on how db access is structured.
// For now, let's assume we can import the tables directly.
import { D1Database } from '@cloudflare/workers-types'; // Import D1 type if needed
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema'; // Import schema tables

// This function would ideally get the D1 instance from the platform context
// We need a way to pass the D1 instance to the adapter. Lucia's adapter expects
// the Drizzle instance directly.
// Let's placeholder this - we'll likely initialize the adapter *inside* hooks/endpoints where
// the platform context (and thus the D1 instance) is available.

// **Placeholder Adapter - Actual initialization will likely move**
// const adapter = new DrizzleSQLiteAdapter(db, schema.sessions, schema.users);

// For now, we define Lucia configuration but postpone adapter initialization.
// We will create the adapter on-the-fly where the `db` instance is available.

export const initializeLucia = (db: D1Database) => {
    const adapter = new DrizzleSQLiteAdapter(drizzle(db, { schema }), schema.sessions, schema.users);
    const lucia = new Lucia(adapter, {
        sessionCookie: {
            attributes: {
                // set to `true` when using HTTPS
                secure: !dev,
            },
        },
        getUserAttributes: (attributes) => {
            return {
                // attributes has the type definition of the user object passed into the adapter (ex: Lucia.DatabaseUserAttributes)
                // Lucia needs username for user identification
                username: attributes.username,
                // email: attributes.email // Include other attributes if needed
            };
        },
    });
    return lucia;
}

// Define Lucia's Database types based on our schema
declare module 'lucia' {
    interface Register {
        Lucia: ReturnType<typeof initializeLucia>; // Use the return type of our initializer
        DatabaseUserAttributes: DatabaseUserAttributes;
        // DatabaseSessionAttributes: DatabaseSessionAttributes; // Not usually needed unless extending session data
    }
}

// Match the select type from Drizzle for user attributes Lucia needs
interface DatabaseUserAttributes {
    id: string;
    username: string | null; // Match schema (nullable)
    email?: string | null; // Optional, match schema (nullable)
}
