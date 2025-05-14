# Drizzle <> Cloudflare D1

This guide assumes familiarity with:

- Database [connection basics](https://orm.drizzle.team/docs/connect-overview) with Drizzle
- D1 Database - [website](https://developers.cloudflare.com/d1/)
- D1 driver - [website](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/)

According to the **[official website](https://developers.cloudflare.com/d1/)**, D1 is Cloudflare’s first queryable relational database.

Drizzle ORM fully supports the Cloudflare D1 database and Cloudflare Workers environment. We embrace SQL dialects and dialect specific drivers and syntax and mirror most popular SQLite-like `all`, `get`, `values` and `run`query methods syntax.

To setup project for your Cloudflare D1 please refer to **[official docs.](https://developers.cloudflare.com/d1/)**

#### Step 1 - Install packages



```shell
bun add drizzle-ormbun add -D drizzle-kit
```



#### Step 2 - Initialize the driver and make a query

You would need to have either a `wrangler.json` or a `wrangler.toml` file for D1 database and will look something like this:



```
{    "name": "YOUR_PROJECT_NAME",    "main": "src/index.ts",    "compatibility_date": "2024-09-26",    "compatibility_flags": [        "nodejs_compat"    ],    "d1_databases": [        {            "binding": "BINDING_NAME",            "database_name": "YOUR_DB_NAME",            "database_id": "YOUR_DB_ID",            "migrations_dir": "drizzle/migrations"        }    ]}
```



Make your first D1 query:



```
import { drizzle } from 'drizzle-orm/d1';export interface Env {  <BINDING_NAME>: D1Database;}export default {  async fetch(request: Request, env: Env) {    const db = drizzle(env.<BINDING_NAME>);    const result = await db.select().from(users).all()    return Response.json(result);  },};
```