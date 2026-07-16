import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase (and most managed Postgres) requires TLS. DATABASE_SSL overrides:
// "false"/"disable" turns TLS off (local Postgres), anything else forces it on.
// Defaults to TLS in production. rejectUnauthorized stays false because the
// Supabase pooler presents a certificate that Node's default CA store can't
// verify without the project's CA bundle; traffic is still encrypted.
function resolveSsl(): pg.PoolConfig["ssl"] {
  const mode = process.env.DATABASE_SSL;
  if (mode === "false" || mode === "disable") return undefined;
  if (mode || process.env.NODE_ENV === "production") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolveSsl(),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
