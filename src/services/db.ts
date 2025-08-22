import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let db: SQLiteDBConnection | null = null

export async function initDB() {
  const sqlite = new SQLiteConnection(CapacitorSQLite)

  // Create or open the database
  db = await sqlite.createConnection('watermelonDB', false, 'no-encryption', 1, false)
  await db.open()

  // Create history table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT,
      result TEXT,
      accuracy INTEGER,
      created_at TEXT
    );
  `)
}

export async function addHistory(image: string, result: string, accuracy: number) {
  if (!db) throw new Error("DB not initialized")
  const createdAt = new Date().toISOString()
  await db.run(
    `INSERT INTO history (image, result, accuracy, created_at) VALUES (?, ?, ?, ?)`,
    [image, result, accuracy, createdAt]
  )
}

export async function getHistory() {
  if (!db) throw new Error("DB not initialized")
  const res = await db.query('SELECT * FROM history ORDER BY id DESC')
  return res.values || []
}

// 🗑️ Delete a single history record
export async function deleteHistory(id: number) {
  if (!db) throw new Error("DB not initialized")
  await db.run(`DELETE FROM history WHERE id = ?`, [id])
}

// 🧹 Clear all history
export async function clearHistory() {
  if (!db) throw new Error("DB not initialized")
  await db.run(`DELETE FROM history`)
}
