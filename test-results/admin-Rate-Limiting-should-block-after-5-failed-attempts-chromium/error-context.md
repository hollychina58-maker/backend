# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Rate Limiting >> should block after 5 failed attempts
- Location: e2e\admin.spec.ts:109:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "Too many login attempts"
Received string:    "(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])self.__next_f.push([1,\"1:HL[\\\"/_next/static/css/app/layout.css?v=1777371717899\\\",\\\"style\\\"]\\n0:D{\\\"name\\\":\\\"r5\\\",\\\"env\\\":\\\"Server\\\"}\\n\"])self.__next_f.push([1,\"2:I[\\\"(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js\\\",[\\\"app-pages-internals\\\",\\\"static/chunks/app-pages-internals.js\\\"],\\\"\\\"]\\n4:I[\\\"(app-pages-browser)/./node_modules/next/dist/client/components/client-page.js\\\",[\\\"app-pages-internals\\\",\\\"static/chunks/app-pages-internals.js\\\"],\\\"ClientPageRoot\\\"]\\n5:I[\\\"(app-pages-browser)/./app/admin/login/page.tsx\\\",[\\\"app/admin/login/page\\\",\\\"static/chunks/app/admin/login/page.js\\\"],\\\"default\\\",1]\\n6:I[\\\"(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js\\\",[\\\"app-pages-internals\\\",\\\"static/chunks/app-pages-internals.js\\\"],\\\"\\\"]\\n7:I[\\\"(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js\\\",[\\\"app-pages-internals\\\",\\\"static/chunks/app-pages-internals.js\\\"],\\\"\\\"]\\n8:I[\\\"(app-pages-browser)/./app/admin/layout.tsx\\\",[\\\"app/admin/layout\\\",\\\"static/chunks/app/admin/layout.js\\\"],\\\"default\\\",1]\\ne:I[\\\"(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js\\\",[\\\"app-pages-internals\\\",\\\"static/chunks/app-pages-internals.js\\\"],\\\"\\\"]\\n3:D{\\\"name\\\":\\\"\\\",\\\"env\\\":\\\"Server\\\"}\\n9:{}\\na:D{\\\"name\\\":\\\"RootLayout\\\",\\\"env\\\":\\\"Server\\\"}\\nb:D{\\\"name\\\":\\\"NotFound\\\",\\\"env\\\":\\\"Server\\\"}\\nb:[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":\\\"404\\\"}],[\\\"$\\\",\\\"div\\\",null,{\"])self.__next_f.push([1,\"\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]]\\na:[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$b\\\",\\\"notFoundStyles\\\":[]}]}]}]\\nc:D{\\\"name\\\":\\\"r6\\\",\\\"env\\\":\\\"Server\\\"}\\nc:null\\nd:D{\\\"name\\\":\\\"\\\",\\\"env\\\":\\\"Server\\\"}\\nf:[]\\n0:[\\\"$\\\",\\\"$L2\\\",null,{\\\"buildId\\\":\\\"development\\\",\\\"assetPrefix\\\":\\\"\\\",\\\"urlParts\\\":[\\\"\\\",\\\"admin\\\",\\\"login\\\"],\\\"initialTree\\\":[\\\"\\\",{\\\"children\\\":[\\\"admin\\\",{\\\"children\\\":[\\\"login\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{}]}]}]},\\\"$undefined\\\",\\\"$undefined\\\",true],\\\"initialSeedData\\\":[\\\"\\\",{\\\"children\\\":[\\\"admin\\\",{\\\"children\\\":[\\\"login\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{},[[\\\"$L3\\\",[\\\"$\\\",\\\"$L4\\\",null,{\\\"props\\\":{\\\"params\\\":{},\\\"searchParams\\\":{}},\\\"Component\\\":\\\"$5\\\"}],null],null],null]},[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"admin\\\",\\\"children\\\",\\\"login\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}]],null]},[[null,[\\\"$\\\",\\\"$L8\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"admin\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}],\\\"params\\\":\\\"$9\\\"}]],null],null]},[[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/css/app/layout.css?v=1777371717899\\\",\\\"precedence\\\":\\\"next_static/css/app/layout.css\\\",\\\"crossOrigin\\\":\\\"$undefined\\\"}]],\\\"$a\\\"],null],null],\\\"couldBeIntercepted\\\":false,\\\"initialHead\\\":[\\\"$c\\\",\\\"$Ld\\\"],\\\"globalErrorComponent\\\":\\\"$e\\\",\\\"missingSlot\"])self.__next_f.push([1,\"s\\\":\\\"$Wf\\\"}]\\n\"])self.__next_f.push([1,\"d:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"charSet\\\":\\\"utf-8\\\"}]]\\n3:null\\n\"])MMMES-MCTI管理员登录密码*登录"
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
      - button "登录" [disabled] [ref=e15]:
        - img [ref=e16]
        - text: 登录
```

# Test source

```ts
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
  76  |     await page.waitForURL('/admin', { timeout: 5000 });
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
> 119 |     expect(errorText).toContain('Too many login attempts');
      |                       ^ Error: expect(received).toContain(expected) // indexOf
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