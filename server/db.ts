import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "cloudoptimizer.sqlite");

let dbInstance: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlJs();
      let filebuffer: Buffer | null = null;
      if (fs.existsSync(dbPath)) {
        try {
          filebuffer = fs.readFileSync(dbPath);
        } catch (e) {
          console.error("Failed to read DB file:", e);
        }
      }
      dbInstance = filebuffer ? new SQL.Database(filebuffer) : new SQL.Database();
      initDbSchema(dbInstance);
      saveDb(dbInstance);
      console.log("Connected to sql.js WASM SQLite database at", dbPath);
      return dbInstance;
    })();
  }
  return initPromise;
}

function saveDb(db: SqlJsDatabase) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error("Error saving SQLite database:", err);
  }
}

function initDbSchema(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      nombre TEXT,
      avatar_url TEXT,
      plan TEXT DEFAULT 'FREE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_limits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mes TEXT NOT NULL,
      consultas_ia_usadas INTEGER DEFAULT 0,
      informes_usados INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, mes)
    );

    CREATE TABLE IF NOT EXISTS cleanup_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      accion TEXT NOT NULL,
      gb_liberados REAL DEFAULT 0,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

export async function dbRun(
  sql: string,
  params: any[] = []
): Promise<{ lastID?: number; changes?: number }> {
  const db = await getDb();
  db.run(sql, params);
  saveDb(db);
  return { lastID: 0, changes: 1 };
}

export async function dbGet<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | undefined> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result: T | undefined = undefined;
  if (stmt.step()) {
    result = stmt.getAsObject() as T;
  }
  stmt.free();
  return result;
}

export async function dbAll<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

