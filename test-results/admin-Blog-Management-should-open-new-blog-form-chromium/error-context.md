# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Blog Management >> should open new blog form
- Location: e2e\admin.spec.ts:85:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/admin" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]: M
      - heading "MMES-MCTI" [level=1] [ref=e8]
      - paragraph [ref=e9]: 管理员登录
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: 密码*
        - textbox "请输入管理员密码" [ref=e14]: admin123
        - paragraph [ref=e15]: Too many login attempts. Please try again later.
      - button "登录" [ref=e16]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  4   | 
  5   | test.describe('Admin Login', () => {
  6   |   test('should display login form', async ({ page }) => {
  7   |     await page.goto('/admin/login');
  8   |     await expect(page.locator('input[type="password"]')).toBeVisible();
  9   |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  10  |   });
  11  | 
  12  |   test('should redirect to dashboard with correct password', async ({ page }) => {
  13  |     await page.goto('/admin/login');
  14  |     await page.fill('input[type="password"]', ADMIN_PASSWORD);
  15  |     await page.click('button[type="submit"]');
  16  |     await page.waitForURL('/admin', { timeout: 5000 });
  17  |   });
  18  | 
  19  |   test('should show error with wrong password', async ({ page }) => {
  20  |     await page.goto('/admin/login');
  21  |     await page.fill('input[type="password"]', 'wrongpassword');
  22  |     await page.click('button[type="submit"]');
  23  |     await expect(page.locator('text=Invalid password')).toBeVisible({ timeout: 3000 });
  24  |   });
  25  | });
  26  | 
  27  | test.describe('Admin Dashboard (authenticated)', () => {
  28  |   test.beforeEach(async ({ page }) => {
  29  |     await page.goto('/admin/login');
  30  |     await page.fill('input[type="password"]', ADMIN_PASSWORD);
  31  |     await page.click('button[type="submit"]');
  32  |     await page.waitForURL('/admin', { timeout: 5000 });
  33  |   });
  34  | 
  35  |   test('should display dashboard', async ({ page }) => {
  36  |     await page.goto('/admin');
  37  |     await expect(page.locator('h1, h2').first()).toBeVisible();
  38  |   });
  39  | 
  40  |   test('should navigate to products', async ({ page }) => {
  41  |     await page.click('a[href="/admin/products"], text=Products');
  42  |     await page.waitForURL('/admin/products', { timeout: 5000 });
  43  |   });
  44  | 
  45  |   test('should navigate to blog', async ({ page }) => {
  46  |     await page.click('a[href="/admin/blog"], text=Blog');
  47  |     await page.waitForURL('/admin/blog', { timeout: 5000 });
  48  |   });
  49  | });
  50  | 
  51  | test.describe('Products Management', () => {
  52  |   test.beforeEach(async ({ page }) => {
  53  |     await page.goto('/admin/login');
  54  |     await page.fill('input[type="password"]', ADMIN_PASSWORD);
  55  |     await page.click('button[type="submit"]');
  56  |     await page.waitForURL('/admin', { timeout: 5000 });
  57  |     await page.goto('/admin/products');
  58  |     await page.waitForLoadState('networkidle');
  59  |   });
  60  | 
  61  |   test('should display products list', async ({ page }) => {
  62  |     await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
  63  |   });
  64  | 
  65  |   test('should open new product form', async ({ page }) => {
  66  |     await page.click('button:has-text("New"), a:has-text("Add")');
  67  |     await expect(page.locator('input[name="id"], input#id')).toBeVisible({ timeout: 3000 });
  68  |   });
  69  | });
  70  | 
  71  | test.describe('Blog Management', () => {
  72  |   test.beforeEach(async ({ page }) => {
  73  |     await page.goto('/admin/login');
  74  |     await page.fill('input[type="password"]', ADMIN_PASSWORD);
  75  |     await page.click('button[type="submit"]');
> 76  |     await page.waitForURL('/admin', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
  77  |     await page.goto('/admin/blog');
  78  |     await page.waitForLoadState('networkidle');
  79  |   });
  80  | 
  81  |   test('should display blog list', async ({ page }) => {
  82  |     await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
  83  |   });
  84  | 
  85  |   test('should open new blog form', async ({ page }) => {
  86  |     await page.click('button:has-text("New"), a:has-text("Add")');
  87  |     await expect(page.locator('input[name="slug"], input#slug')).toBeVisible({ timeout: 3000 });
  88  |   });
  89  | });
  90  | 
  91  | test.describe('Security Headers', () => {
  92  |   test('should have security headers on API', async ({ request }) => {
  93  |     const response = await request.get('http://localhost:3001/api/products');
  94  |     expect(response.headers()['x-content-type-options']).toBe('nosniff');
  95  |     expect(response.headers()['x-frame-options']).toBe('DENY');
  96  |   });
  97  | 
  98  |   test('should have security headers on admin pages', async ({ page }) => {
  99  |     await page.goto('/admin/login');
  100 |     const headers = await page.evaluate(() => {
  101 |       return {
  102 |         'x-content-type-options': document.headers?.['x-content-type-options'] || 'not set',
  103 |       };
  104 |     });
  105 |   });
  106 | });
  107 | 
  108 | test.describe('Rate Limiting', () => {
  109 |   test('should block after 5 failed attempts', async ({ page }) => {
  110 |     await page.goto('/admin/login');
  111 |     for (let i = 0; i < 5; i++) {
  112 |       await page.fill('input[type="password"]', 'wrongpassword');
  113 |       await page.click('button[type="submit"]');
  114 |       await page.waitForTimeout(100);
  115 |     }
  116 |     await page.fill('input[type="password"]', ADMIN_PASSWORD);
  117 |     await page.click('button[type="submit"]');
  118 |     const errorText = await page.locator('body').textContent();
  119 |     expect(errorText).toContain('Too many login attempts');
  120 |   });
  121 | });
  122 | 
  123 | test.describe('CORS', () => {
  124 |   test('should allow from allowed origin', async ({ request }) => {
  125 |     const response = await request.get('http://localhost:3001/api/products', {
  126 |       headers: { origin: 'http://localhost:3000' },
  127 |     });
  128 |     expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  129 |   });
  130 | 
  131 |   test('should not allow from unknown origin', async ({ request }) => {
  132 |     const response = await request.get('http://localhost:3001/api/products', {
  133 |       headers: { origin: 'http://evil.com' },
  134 |     });
  135 |     const corsOrigin = response.headers()['access-control-allow-origin'];
  136 |     if (corsOrigin && corsOrigin !== '*') {
  137 |       expect(corsOrigin).not.toBe('http://evil.com');
  138 |     }
  139 |   });
  140 | });
```