import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform }) => {
    if (!platform?.env?.DB) {
        console.error('Database binding DB not found in platform environment.');
        // Use SvelteKit error helper for server errors
        // This will generate a standard error response
        throw error(500, 'Database configuration error. Binding not found.'); 
    }

    try {
        const d1 = platform.env.DB;
        const stmt = d1.prepare("SELECT 'banana' as fruit");
        const result = await stmt.first<{ fruit: string }>();

        if (!result || typeof result.fruit !== 'string') {
            console.error('Database query returned unexpected or no result:', result);
            // Return JSON error response
            return json({ success: false, error: 'Query returned unexpected result.' }, { status: 500 });
        }

        const fruit = result.fruit;
        console.log('Server log: Database query successful! Result:', fruit); // Log on the server
        // Return JSON success response
        return json({ success: true, fruit: fruit });

    } catch (err: any) {
        console.error('Database query failed:', err);
        const errorMessage = err.message || 'Unknown database error';
        // Return JSON error response
        return json({ success: false, error: `Failed to query database: ${errorMessage}` }, { status: 500 });
        // Alternatively, re-throw as a SvelteKit error:
        // throw error(500, `Failed to query database: ${errorMessage}`);
    }
};
