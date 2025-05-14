import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema/users';

/**
 * Initialize a database connection using Drizzle with Cloudflare D1
 * 
 * @param {D1Database} d1 - The D1 database instance from env.DB
 * @returns {Object} - Drizzle DB instance
 */
export function initDB(d1) {
  if (!d1) {
    throw new Error('D1 database connection not available');
  }
  
  return drizzle(d1, { schema });
}