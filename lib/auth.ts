import bcrypt from 'bcryptjs';
import { getDb, isDatabaseAvailable, initializeDatabase } from './db';

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
    return false;
  }

  await ensureDbInitialized();

  const sql = getDb();
  if (!sql) {
    return false;
  }

  try {
    const result = await sql`SELECT password_hash FROM admin_users WHERE id = 'admin'`;
    if (result.length === 0) {
      return false;
    }
    const storedHash = result[0].password_hash;
    return bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '密码至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '需包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '需包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '需包含数字' };
  }
  return { valid: true };
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isDatabaseAvailable()) {
    return { success: false, error: 'Database not available' };
  }

  const isValid = await verifyPassword(oldPassword);
  if (!isValid) {
    return { success: false, error: '旧密码错误' };
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error };
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
