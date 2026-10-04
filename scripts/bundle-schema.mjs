import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Concatenates the migrations into one file that can be pasted into a fresh
 * Supabase SQL editor in a single go. Applying eight files by hand invites
 * applying them out of order, and the order matters: a `language sql` function
 * body is validated when it is created, so each one must come after the table
 * it reads.
 *
 * The bundle is generated, never edited. A test asserts it matches the
 * migrations so the two cannot drift.
 */

const DIR = join(process.cwd(), "supabase");
const MIGRATIONS = join(DIR, "migrations");

export async function buildBundle() {
  const files = (await readdir(MIGRATIONS))
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort();

  const rule = "-- " + "─".repeat(73);
  const parts = [
    "-- " + "=".repeat(76),
    "-- PROFITY V2 — schéma complet",
    "--",
    "-- Généré depuis supabase/migrations/. Ne pas éditer ici : modifiez la",
    "-- migration concernée puis relancez  npm run db:bundle",
    "-- " + "=".repeat(76),
  ];

  for (const file of files) {
    const sql = (await readFile(join(MIGRATIONS, file), "utf8")).trim();
    parts.push("", rule, `-- ${file}`, rule, "", sql, "");
  }

  return parts.join("\n") + "\n";
}

// Only write when run directly, so the test can import buildBundle to compare.
if (import.meta.filename === process.argv[1]) {
  const bundle = await buildBundle();
  const out = join(DIR, "schema.sql");
  await writeFile(out, bundle, "utf8");
  console.log(`schema.sql écrit — ${bundle.split("\n").length} lignes`);
}
