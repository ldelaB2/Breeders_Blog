// Run once before the suite (see "test" in package.json): applies any
// migrations the local test database doesn't have yet. Non-destructive -
// each test empties the tables itself (harness.js). If the test database
// ever drifts from the migrations, drop and recreate it (README).
import { execFileSync } from "node:child_process";
import { assertLocalDatabase } from "./guard.js";

assertLocalDatabase();
execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: ["ignore", "ignore", "inherit"], env: process.env });
