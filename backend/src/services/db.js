const { Pool } = require("pg");
const { env } = require("../config/env");

let pool = null;

function normalizeConnectionString(url) {
  const value = String(url || "");
  if (!value) return value;
  // pg warns that sslmode=require will change semantics in future versions.
  return value.replace(/sslmode=require/gi, "sslmode=verify-full");
}

function getPool() {
  if (!env.databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: normalizeConnectionString(env.databaseUrl) });
  }
  return pool;
}

async function isDbReady() {
  const p = getPool();
  if (!p) {
    return false;
  }
  try {
    await p.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { getPool, isDbReady };
