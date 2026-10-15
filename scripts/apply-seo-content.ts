import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Writes reviewed catalogue copy from docs/seo/content.json into the database:
// descriptions and SEO fields on products, teams, drivers and categories, and alt
// text on media. Only the fields listed in the file are touched, matched by row id.
//
//   npx tsx scripts/apply-seo-content.ts                 dry run: per-field diff, writes nothing
//   npx tsx scripts/apply-seo-content.ts --apply         writes every change in one transaction
//   npx tsx scripts/apply-seo-content.ts --file x.json   another content file
//
// DATABASE_URL must be the live database. It's read from .env, but a value already
// in the environment wins (e.g. `node --env-file=<prod env file> --import tsx ...`).
// Run from the repo root.
//
// These writes bypass the admin, so no cache tag expires and the public pages keep
// the old copy until you press "Refresh public pages" on the admin dashboard
// (see docs/architecture/caching.md).

type Value = string;
type Entry = { _expect?: Record<string, unknown> } & Record<string, unknown>;
type Content = Record<string, unknown>;

// Columns this script may write, per table. Anything else in the file is rejected.
const WRITABLE = {
  products: ["description", "seo_title", "seo_description"],
  teams: ["description", "seo_title", "seo_description"],
  drivers: ["description", "seo_title", "seo_description"],
  categories: ["description", "seo_title", "seo_description"],
  media: ["alt"],
} as const;
type TableName = keyof typeof WRITABLE;

// Same limits as the admin's counters.
const MAX: Record<string, number> = { seo_title: 60, seo_description: 160 };

const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Never let the connection string (or any credentials in a URL) reach the terminal. */
function redact(s: string): string {
  const url = process.env.DATABASE_URL;
  const out = url ? s.split(url).join("[DATABASE_URL]") : s;
  return out.replace(/(postgres(?:ql)?:\/\/)[^\s"'@/]*@/gi, "$1[credentials]@");
}

function errorText(e: unknown): string {
  const parts: string[] = [];
  for (let x: unknown = e, i = 0; x && i < 4; x = (x as { cause?: unknown }).cause, i++) {
    parts.push(x instanceof Error ? x.message : String(x));
  }
  return redact(parts.join("\n  caused by: "));
}

type Change = { table: TableName; id: number; label: string; field: string; from: unknown; to: Value };
type Plan = { changes: Change[]; unchanged: number; skipped: string[] };

/** Parse and validate the file; throws on anything this script shouldn't write. */
function parse(content: Content) {
  const want: { table: TableName; id: number; expect: Record<string, unknown>; fields: [string, Value][] }[] = [];
  const problems: string[] = [];
  for (const [table, rows] of Object.entries(content)) {
    if (table.startsWith("_")) continue;
    if (!(table in WRITABLE)) {
      problems.push(`unknown table "${table}"`);
      continue;
    }
    const allowed = WRITABLE[table as TableName] as readonly string[];
    for (const [idKey, raw] of Object.entries(rows as Record<string, Entry>)) {
      const id = Number(idKey);
      if (!Number.isInteger(id) || id <= 0) {
        problems.push(`${table}: bad id "${idKey}"`);
        continue;
      }
      const fields: [string, Value][] = [];
      for (const [field, value] of Object.entries(raw)) {
        if (field.startsWith("_")) continue;
        const where = `${table} #${id} ${field}`;
        if (!allowed.includes(field)) problems.push(`${where}: not a writable field (allowed: ${allowed.join(", ")})`);
        else if (typeof value !== "string" || !value.trim()) problems.push(`${where}: must be a non-empty string`);
        else if (MAX[field] && value.length > MAX[field]) problems.push(`${where}: ${value.length} chars, max ${MAX[field]}`);
        else fields.push([field, value]);
      }
      if (fields.length) want.push({ table: table as TableName, id, expect: raw._expect ?? {}, fields });
    }
  }
  if (problems.length) throw new Error(`content file has problems:\n  ${problems.join("\n  ")}`);
  return want;
}

function show(v: unknown): string {
  if (v == null || v === "") return "(empty)";
  return String(v).replace(/\n/g, "\n      ");
}

function printPlan(plan: Plan) {
  let last = "";
  for (const c of plan.changes) {
    const head = `${c.table} #${c.id}  ${c.label}`;
    if (head !== last) console.log(`\n${head}`);
    last = head;
    console.log(`  ~ ${c.field}\n    - ${show(c.from)}\n    + ${show(c.to)}`);
  }
  for (const s of plan.skipped) console.log(`\nSKIPPED ${s}`);
  console.log(
    `\n${plan.changes.length} field(s) to change, ${plan.unchanged} already up to date, ${plan.skipped.length} row(s) skipped.`,
  );
}

// Neon sometimes drops a connection ("fetch failed"). Every write sets a fixed value
// inside one transaction, so running the whole thing again is safe.
async function retry<T>(what: string, fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      console.warn(`${what} failed (attempt ${i}/${tries}), retrying: ${errorText(e).split("\n")[0]}`);
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.indexOf("--file");
  const file = path.resolve(fileArg >= 0 ? args[fileArg + 1] : "docs/seo/content.json");

  const want = parse(JSON.parse(await readFile(file, "utf8")) as Content);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  // Imported after dotenv so src/db sees DATABASE_URL.
  const { db, withTx, schema } = await import("../src/db");
  const { eq, inArray } = await import("drizzle-orm");
  type Q = typeof db;

  const tables = {
    products: schema.products,
    teams: schema.teams,
    drivers: schema.drivers,
    categories: schema.categories,
    media: schema.media,
  };
  // Every table here has a serial `id`; one representative type keeps drizzle's
  // query builder happy with a table chosen at run time.
  const tbl = (name: TableName) => tables[name] as unknown as typeof schema.teams;

  /** Read the current rows and work out which fields actually change. */
  async function plan(q: Q): Promise<Plan> {
    const out: Plan = { changes: [], unchanged: 0, skipped: [] };
    for (const name of Object.keys(WRITABLE) as TableName[]) {
      const rowsWanted = want.filter((w) => w.table === name);
      if (!rowsWanted.length) continue;
      const t = tbl(name);
      const rows = (await q.select().from(t).where(inArray(t.id, rowsWanted.map((w) => w.id)))) as unknown as Record<string, unknown>[];
      const byId = new Map(rows.map((r) => [r.id as number, r]));
      for (const w of rowsWanted) {
        const row = byId.get(w.id);
        if (!row) {
          out.skipped.push(`${name} #${w.id}: no such row`);
          continue;
        }
        const mismatch = Object.entries(w.expect).find(([k, v]) => row[camel(k)] !== v);
        if (mismatch) {
          out.skipped.push(
            `${name} #${w.id}: expected ${mismatch[0]} = ${JSON.stringify(mismatch[1])}, found ${JSON.stringify(row[camel(mismatch[0])])}. Wrong database, or ids differ?`,
          );
          continue;
        }
        const label = String(row.name ?? "");
        for (const [field, to] of w.fields) {
          const from = row[camel(field)];
          if (from === to) out.unchanged++;
          else out.changes.push({ table: name, id: w.id, label, field, from, to });
        }
      }
    }
    return out;
  }

  if (!apply) {
    printPlan(await retry("Reading current values", () => plan(db)));
    console.log("\nDry run: nothing was written. Re-run with --apply to write these changes.");
    return;
  }

  const written = await retry("Transaction", () =>
    withTx(async (tx) => {
      const q = tx as unknown as Q;
      // Plan again inside the transaction so the diff matches what gets written.
      const p = await plan(q);
      const rows = new Map<string, Change[]>();
      for (const c of p.changes) {
        const k = `${c.table}:${c.id}`;
        rows.set(k, [...(rows.get(k) ?? []), c]);
      }
      for (const cs of rows.values()) {
        const { table, id } = cs[0];
        const t = tbl(table);
        const set: Record<string, unknown> = Object.fromEntries(cs.map((c) => [camel(c.field), c.to]));
        // Bumps the sitemap's lastmod; media has no updated_at.
        if ("updatedAt" in tables[table]) set.updatedAt = new Date();
        await q.update(t).set(set as never).where(eq(t.id, id));
      }
      return p;
    }),
  );
  printPlan(written);
  console.log(`\nApplied ${written.changes.length} field change(s) in one transaction.`);
  console.log('Now press "Refresh public pages" on the admin dashboard so the live site shows the new copy.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`\napply-seo-content: ${errorText(e)}`);
    process.exit(1);
  });
