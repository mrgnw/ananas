# Database Management (Drizzle ORM + Cloudflare D1)

This project uses [Drizzle ORM](https://orm.drizzle.team/) for database schema definition and migrations, and [Cloudflare D1](https://developers.cloudflare.com/d1/) for the database service.

## Migrations

Migrations allow for controlled updates to the database schema.

### 1. Define Schema

Modify the schema definitions in `src/lib/server/schema.ts`.

### 2. Generate Migration Files

After changing the schema, generate the SQL migration files:

```bash
bunx drizzle-kit generate
```

This command compares your schema file to the database state (tracked locally) and creates a new `.sql` file in the `drizzle/` directory.

### 3. Apply Migrations Locally

To apply pending migrations to your local development database (defined in `wrangler.json` and managed by Miniflare), run:

```bash
bunx drizzle-kit migrate
```

*Note: Sometimes, if the local `.wrangler/state` gets out of sync, you might need to delete the `.wrangler/state` directory and run the migrate command again.* 
*(Drizzle Kit requires `@libsql/client` or `better-sqlite3` installed as a dev dependency for local migrations).* 

### 4. Apply Migrations Remotely (Cloudflare D1)

To apply pending migrations to the **live** Cloudflare D1 database, use the `wrangler` CLI. Make sure your `wrangler.json` specifies the correct `database_name`.

For the development database (`ananas-auth-dev`):

```bash
bunx wrangler d1 migrations apply ananas-auth-dev --remote
```

*Replace `ananas-auth-dev` with your production database name if you have a separate one.* 

*Note: If you encounter errors like "table already exists" during remote migration, it might mean a previous migration was applied manually or failed partway. You may need to manually adjust the state or temporarily comment out statements in the corresponding migration file before retrying the `apply --remote` command.*
