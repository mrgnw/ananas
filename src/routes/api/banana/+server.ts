import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ platform }) => {
    if (!platform?.env?.DB) {
        console.error('Database binding DB not found in platform environment.');
        throw error(500, 'Database configuration error. Binding not found.');
    }

    try {
        const db = drizzle(platform.env.DB, { schema });

        const counterId = 1;
        const result = await db
            .insert(schema.testCounter)
            .values({ id: counterId, count: 1 })
            .onConflictDoUpdate({ 
                target: schema.testCounter.id, 
                set: { count: sql`${schema.testCounter.count} + 1` } 
            })
            .returning({ updatedCount: schema.testCounter.count });

        if (!result || result.length === 0 || typeof result[0]?.updatedCount !== 'number') {
            console.error('Insert/Update operation failed or returned unexpected result:', result);
            return json({ success: false, error: 'Counter update failed.' }, { status: 500 });
        }

        const newCount = result[0].updatedCount;
        console.log('Server log: Counter updated successfully! New count:', newCount); 
        return json({ success: true, count: newCount });

    } catch (err: any) {
        console.error('Database operation failed:', err);
        const errorMessage = err.message || 'Unknown database error';
        return json({ success: false, error: `Database operation failed: ${errorMessage}` }, { status: 500 });
    }
};
