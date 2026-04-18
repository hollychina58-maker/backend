const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}
