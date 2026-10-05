import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNeonWs } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// One variable, any host: DATABASE_URL is a plain Postgres connection string.
// Neon URLs use Neon's HTTP driver (no connection pool to exhaust on serverless);
// anything else (local Postgres, Supabase, RDS, a VPS) uses node-postgres.
const url = process.env.DATABASE_URL;

export const hasDb = Boolean(url);

const isNeon = !url || /\.neon\.tech/.test(url);

type DB = ReturnType<typeof drizzleNeonHttp<typeof schema>>;

const pgDb = isNeon ? null : drizzlePg(url!, { schema });

export const db: DB = isNeon
  ? drizzleNeonHttp(neon(url || "postgresql://placeholder@localhost/none"), { schema })
  : (pgDb as unknown as DB);

export type Tx = Parameters<Parameters<ReturnType<typeof drizzlePg<typeof schema>>["transaction"]>[0]>[0];

/**
 * Run `fn` inside a real transaction. Neon's HTTP driver can't hold one open, so on
 * Neon this opens a short-lived WebSocket pool just for the transaction (checkout and
 * order status changes). Other hosts use the normal node-postgres client.
 */
export async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (pgDb) return pgDb.transaction(fn);
  const pool = new Pool({ connectionString: url });
  try {
    const wsDb = drizzleNeonWs(pool, { schema });
    return await wsDb.transaction(fn as never);
  } finally {
    await pool.end();
  }
}

export { schema };
