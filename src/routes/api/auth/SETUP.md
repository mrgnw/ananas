# Setting up Authentication with Cloudflare D1

This authentication system uses Cloudflare D1, which requires Wrangler for local development. We've implemented a dual-server approach that lets you develop with SvelteKit while accessing D1 through Wrangler.

## Dual-Server Development Setup

For the best development experience with D1, run both servers:

1. Install Wrangler CLI globally if you haven't already:
   ```bash
   npm install -g wrangler
   ```

2. Make sure your wrangler.json file has the correct D1 database binding:
   ```json
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "ananas-auth-dev",
         "database_id": "your-database-id",
         "migrations_dir": "drizzle/migrations"
       }
     ]
   }
   ```

3. Create a local development D1 database:
   ```bash
   wrangler d1 create ananas-auth-dev
   ```

4. Apply migrations to your local D1 database:
   ```bash
   wrangler d1 migrations apply ananas-auth-dev
   ```

5. Run both servers in separate terminals:

   **Terminal 1 - Wrangler server (provides D1 access)**
   ```bash
   wrangler dev --local
   ```
   This will run on http://localhost:8787

   **Terminal 2 - SvelteKit dev server**
   ```bash
   bun run dev
   ```
   This will run on http://localhost:5173 (or similar)

The SvelteKit server will proxy database requests to the Wrangler server automatically.

## Testing Authentication

Once your environment is set up, test the database connection by visiting:
`/api/auth/test`

If everything is working correctly, you should see a successful response with the list of tables in your D1 database.

## How It Works

1. When you access an auth endpoint in the SvelteKit app, it checks if D1 is available
2. If not, it automatically proxies the request to the Wrangler server running on port 8787
3. The Wrangler server handles the database operation and returns the result
4. This approach lets you use SvelteKit's hot reloading while still having access to D1

## Troubleshooting

- If you're getting "Failed to connect to Wrangler dev server" errors, make sure Wrangler is running on port 8787
- If you're getting "Database binding not found" errors, make sure your wrangler.json file is correctly configured
- If you're getting database connection errors, try recreating your local D1 database and reapplying migrations