import bcrypt from 'bcryptjs';
import { getDb, isDatabaseAvailable, initializeDatabase } from './db';

const FALLBACK_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SALT_ROUNDS = 10;

let dbInitialized = false;

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    return password === FALLBACK_PASSWORD;
  }

  await ensureDbInitialized();

  const sql = getDb();
  if (!sql) return password === FALLBACK_PASSWORD;

  try {
    const result = await sql`SELECT password_hash FROM admin_users WHERE id = 'admin'`;
    if (result.length === 0) {
      const hash = await bcrypt.hash(FALLBACK_PASSWORD, SALT_ROUNDS);
      await sql`INSERT INTO admin_users (id, password_hash) VALUES ('admin', ${hash})`;
      return password === FALLBACK_PASSWORD;
    }
    const storedHash = result[0].password_hash;
    return bcrypt.compare(password, storedHash);
  } catch {
    return password === FALLBACK_PASSWORD;
  }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isDatabaseAvailable()) {
    return { success: false, error: 'Database not available' };
  }

  await ensureDbInitialized();

  const isValid = await verifyPassword(oldPassword);
  if (!isValid) {
    return { success: false, error: '旧密码错误' };
  }

  const sql = getDb();
  if (!sql) {
    return { success: false, error: 'Database connection failed' };
  }

  try {
    // First check if admin record exists
    const existing = await sql`SELECT id FROM admin_users WHERE id = 'admin'`;

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const now = new Date().toISOString();

    if (existing.length === 0) {
      // Record doesn't exist - do INSERT
      await sql`INSERT INTO admin_users (id, password_hash, updated_at) VALUES ('admin', ${hash}, ${now})`;
    } else {
      // Record exists - do UPDATE
      await sql`UPDATE admin_users SET password_hash = ${hash}, updated_at = ${now} WHERE id = 'admin'`;
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, error: '修改密码失败' };
  }
}
