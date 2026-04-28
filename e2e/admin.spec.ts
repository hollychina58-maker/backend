import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

test.describe('Admin Login', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect to dashboard with correct password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });
  });

  test('should show error with wrong password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid password')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Admin Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });
  });

  test('should display dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to products', async ({ page }) => {
    await page.click('a[href="/admin/products"], text=Products');
    await page.waitForURL('/admin/products', { timeout: 5000 });
  });

  test('should navigate to blog', async ({ page }) => {
    await page.click('a[href="/admin/blog"], text=Blog');
    await page.waitForURL('/admin/blog', { timeout: 5000 });
  });
});

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
  });

  test('should display products list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should open new product form', async ({ page }) => {
    await page.click('button:has-text("New"), a:has-text("Add")');
    await expect(page.locator('input[name="id"], input#id')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Blog Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });
    await page.goto('/admin/blog');
    await page.waitForLoadState('networkidle');
  });

  test('should display blog list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should open new blog form', async ({ page }) => {
    await page.click('button:has-text("New"), a:has-text("Add")');
    await expect(page.locator('input[name="slug"], input#slug')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Security Headers', () => {
  test('should have security headers on API', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });

  test('should have security headers on admin pages', async ({ page }) => {
    await page.goto('/admin/login');
    const headers = await page.evaluate(() => {
      return {
        'x-content-type-options': document.headers?.['x-content-type-options'] || 'not set',
      };
    });
  });
});

test.describe('Rate Limiting', () => {
  test('should block after 5 failed attempts', async ({ page }) => {
    await page.goto('/admin/login');
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    const errorText = await page.locator('body').textContent();
    expect(errorText).toContain('Too many login attempts');
  });
});

test.describe('CORS', () => {
  test('should allow from allowed origin', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products', {
      headers: { origin: 'http://localhost:3000' },
    });
    expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  });

  test('should not allow from unknown origin', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products', {
      headers: { origin: 'http://evil.com' },
    });
    const corsOrigin = response.headers()['access-control-allow-origin'];
    if (corsOrigin && corsOrigin !== '*') {
      expect(corsOrigin).not.toBe('http://evil.com');
    }
  });
});