#!/usr/bin/env node

/**
 * Smart Type Generation Checker
 *
 * This script implements intelligent caching for Blok SDK type generation:
 * 1. Checks if types exist and are recent
 * 2. Compares workflow discovery endpoint for changes
 * 3. Only regenerates types when necessary
 *
 * Based on best practices from tRPC, Prisma, and GraphQL CodeGen
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TYPES_DIR = path.join(__dirname, "..", "src", "blok-types");
const CACHE_FILE = path.join(TYPES_DIR, ".cache.json");
const BACKEND_URL = "http://localhost:4000";

// Maximum age for types (in milliseconds) - 1 hour
const MAX_TYPES_AGE = 60 * 60 * 1000;

/**
 * Check if types directory exists and has recent files
 */
function checkTypesExist() {
  try {
    const typesFile = path.join(TYPES_DIR, "types.ts");
    const hooksFile = path.join(TYPES_DIR, "hooks.ts");

    if (!fs.existsSync(typesFile) || !fs.existsSync(hooksFile)) {
      console.log("📝 Types files missing, regeneration needed");
      return false;
    }

    const typesStats = fs.statSync(typesFile);
    const age = Date.now() - typesStats.mtime.getTime();

    if (age > MAX_TYPES_AGE) {
      console.log("⏰ Types are older than 1 hour, regeneration recommended");
      return false;
    }

    console.log("✅ Types exist and are recent");
    return true;
  } catch (error) {
    console.log("❌ Error checking types:", error.message);
    return false;
  }
}

/**
 * Get workflow discovery hash for change detection
 */
async function getWorkflowsHash() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/workflow-discovery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        includeSchemas: false, // Just get metadata for hash
        filterByRole: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error("Invalid workflow discovery response");
    }

    // Create hash from workflow count and names
    const workflows = data.data.workflows || [];
    const hashSource = workflows
      .map((w) => `${w.name}-${w.method}-${w.path}`)
      .sort()
      .join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashSource.length; i++) {
      const char = hashSource.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return {
      hash: hash.toString(),
      count: workflows.length,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.log("⚠️  Could not fetch workflows hash:", error.message);
    return null;
  }
}

/**
 * Load cached metadata
 */
function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheData = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(cacheData);
  } catch (error) {
    console.log("⚠️  Could not load cache:", error.message);
    return null;
  }
}

/**
 * Save cache metadata
 */
function saveCache(data) {
  try {
    if (!fs.existsSync(TYPES_DIR)) {
      fs.mkdirSync(TYPES_DIR, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log("💾 Cache updated");
  } catch (error) {
    console.log("⚠️  Could not save cache:", error.message);
  }
}

/**
 * Main check function
 */
async function main() {
  console.log("🔍 Checking if SDK type generation is needed...");

  // Step 1: Check if types exist and are recent
  if (!checkTypesExist()) {
    console.log("🚀 Types regeneration needed");
    process.exit(1); // Exit with error to trigger regeneration
  }

  // Step 2: Check for workflow changes
  const currentHash = await getWorkflowsHash();
  if (!currentHash) {
    console.log("⚠️  Could not check for changes, using existing types");
    process.exit(0); // Exit successfully to use existing types
  }

  const cache = loadCache();
  if (!cache || cache.hash !== currentHash.hash) {
    console.log("🔄 Workflow changes detected, regeneration needed");
    console.log(`   Previous: ${cache?.count || "unknown"} workflows`);
    console.log(`   Current:  ${currentHash.count} workflows`);

    // Save new hash for next time
    saveCache(currentHash);
    process.exit(1); // Exit with error to trigger regeneration
  }

  console.log("✅ No changes detected, using existing types");
  console.log(`   Workflows: ${currentHash.count}`);
  console.log(`   Hash: ${currentHash.hash}`);

  process.exit(0); // Exit successfully to use existing types
}

// Run the check
main().catch((error) => {
  console.error("❌ Check failed:", error);
  process.exit(1);
});
