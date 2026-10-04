#!/usr/bin/env node
/**
 * Helper script to show database setup instructions
 * Actual SQL setup should be done in Supabase SQL Editor
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n🚀 ProfityX Database Setup\n");

if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
  console.error("❌ Supabase credentials not configured\n");
  console.log("Set these environment variables in .env.local:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL=...");
  console.log("  SUPABASE_SERVICE_ROLE_KEY=...\n");
  process.exit(1);
}

console.log("✅ Supabase credentials found\n");

console.log("📋 To initialize your database, run this SQL in Supabase:\n");
console.log("1. Go to: https://supabase.com/dashboard");
console.log("2. Select your project");
console.log("3. SQL Editor → New Query");
console.log("4. Copy & paste the SQL from: scripts/init-supabase.sql");
console.log("5. Click 'Run'\n");

console.log("Or directly open the SQL file and copy it:");
const sqlPath = path.join(__dirname, "init-supabase.sql");
if (fs.existsSync(sqlPath)) {
  console.log(`  File: ${sqlPath}\n`);
} else {
  console.log("  (File not found - check scripts/init-supabase.sql)\n");
}
