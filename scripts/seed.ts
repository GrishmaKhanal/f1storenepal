import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Run with --conditions=react-server (see package.json) so `server-only` imports resolve.
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const { seedDatabase } = await import("../src/db/seed");
  const r = await seedDatabase((f) => readFile(path.join("public/assets", f)));
  console.log(r.skipped ? "seed: database already has content, nothing imported." : "seed: starter content imported.");
  console.log("Changed the DB outside the admin: use 'Refresh public pages' on the admin dashboard.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
