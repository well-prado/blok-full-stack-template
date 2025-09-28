#!/usr/bin/env node

/**
 * Check if Blok SDK types need to be generated
 * This script checks if types exist and are recent enough
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TYPES_DIR = path.join(__dirname, "..", "src", "blok-types");
const TYPES_FILE = path.join(TYPES_DIR, "types.ts");
const MAX_AGE_HOURS = 24; // Regenerate types if older than 24 hours

function checkTypesExist() {
  console.log("🔍 Checking if SDK type generation is needed...");

  // Check if types directory exists
  if (!fs.existsSync(TYPES_DIR)) {
    console.log("❌ Types directory does not exist");
    process.exit(1);
  }

  // Check if types file exists
  if (!fs.existsSync(TYPES_FILE)) {
    console.log("❌ Types file does not exist");
    process.exit(1);
  }

  // Check if types are recent enough
  const stats = fs.statSync(TYPES_FILE);
  const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

  if (ageInHours > MAX_AGE_HOURS) {
    console.log(
      `❌ Types are older than ${MAX_AGE_HOURS} hours (${ageInHours.toFixed(1)}h)`
    );
    process.exit(1);
  }

  console.log("✅ Types exist and are recent");
  process.exit(0);
}

checkTypesExist();
