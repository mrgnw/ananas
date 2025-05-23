export default {
  schema: "./src/lib/server/schema/users.js",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1",
  dbCredentials: {
    wranglerConfigPath: "./wrangler.json",
    dbName: "ananas-auth-dev"
  }
};