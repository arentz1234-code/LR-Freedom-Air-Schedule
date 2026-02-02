import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || 'file:local.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  const db = getClient();

  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      color TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'renter',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Maintenance table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Oil logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS oil_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date DATETIME NOT NULL,
      quarts REAL NOT NULL,
      hobbs_time REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return { success: true };
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getClient();
  const result = await db.execute({ sql, args: params as any[] });
  return result.rows as T[];
}

export async function run(sql: string, params: unknown[] = []) {
  const db = getClient();
  const result = await db.execute({ sql, args: params as any[] });
  return { lastInsertRowid: result.lastInsertRowid ? Number(result.lastInsertRowid) : null };
}

export async function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const db = getClient();
  const result = await db.execute({ sql, args: params as any[] });
  return result.rows[0] as T | undefined;
}

// Predefined colors for users
export const USER_COLORS = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
];

export const MAINTENANCE_COLOR = '#EAB308'; // Yellow
