import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema/users';
import { dev } from '$app/environment';

/**
 * Initialize a database connection using Drizzle with Cloudflare D1
 * 
 * @param {D1Database} d1 - The D1 database instance from env.DB
 * @returns {Object} - Drizzle DB instance
 */
export function initDB(d1) {
  if (!d1) {
    if (dev) {
      console.warn('D1 database connection not available in development mode');
      // In development, you could return a mock DB or throw a more informative error
      throw new Error('D1 database connection not available. Use `wrangler dev` to test with a real D1 database.');
    } else {
      throw new Error('D1 database connection not available');
    }
  }
  
  return drizzle(d1, { schema });
}

/**
 * Checks if the D1 database is available
 * 
 * @param {Object} platform - The platform object from SvelteKit
 * @returns {boolean} - Whether D1 is available
 */
export function isD1Available(platform) {
  return !!platform?.env?.DB;
}