import bcrypt from 'bcryptjs';
import { getDb, isDatabaseAvailable } from './db';

const FALLBACK_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SALT_ROUNDS = 10;

export async function verifyPassword(password: string): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    return password === FALLBACK_PASSWORD;
  }

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

  const isValid = await verifyPassword(oldPassword);
  if (!isValid) {
    return { success: false, error: '旧密码错误' };
  }

  const sql = getDb();
  if (!sql) {
    return { success: false, error: 'Database connection failed' };
  }

  try {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const now = new Date().toISOString();
    await sql`UPDATE admin_users SET password_hash = ${hash}, updated_at = ${now} WHERE id = 'admin'`;
    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, error: '修改密码失败' };
  }
}
