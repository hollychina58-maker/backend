# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> 14. Rate limiting on login - 6 wrong passwords
- Location: e2e\admin.spec.ts:416:5

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: M
      - heading "MMES-MCTI" [level=1] [ref=e7]
      - paragraph [ref=e8]: 管理员登录
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: 密码*
        - textbox "请输入管理员密码" [ref=e13]: wrongpassword5
        - paragraph [ref=e14]: Invalid password
      - button "登录" [ref=e15]
  - alert [ref=e16]
```

# Test source

```ts
  340 | 
  341 |     // Make a small change to title
  342 |     const titleInput = page.locator('input[placeholder*="标题"], input[placeholder*="title"]').first();
  343 |     if (await titleInput.isVisible()) {
  344 |       await titleInput.fill('Updated Test Blog Post E2E - Edited');
  345 |     }
  346 | 
  347 |     // Save button
  348 |     const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")').first();
  349 |     if (await saveBtn.isVisible()) {
  350 |       await saveBtn.click();
  351 |       await page.waitForTimeout(3000);
  352 |     }
  353 |   }
  354 | });
  355 | 
  356 | // ============================================
  357 | // Test 12: Delete blog post works
  358 | // ============================================
  359 | test('12. Delete blog post works', async ({ page }) => {
  360 |   const loggedIn = await login(page);
  361 |   if (!loggedIn) {
  362 |     test.skip(true, 'Cannot login - check ADMIN_PASSWORD');
  363 |   }
  364 | 
  365 |   await page.goto('/admin/blog', { timeout: 15000 });
  366 |   await page.waitForLoadState('domcontentloaded');
  367 | 
  368 |   // Wait for table to load
  369 |   await page.waitForTimeout(2000);
  370 | 
  371 |   // Look for delete button in the first row
  372 |   const deleteButton = page.locator('button:has-text("删除"), button:has-text("Delete")').first();
  373 |   if (await deleteButton.isVisible()) {
  374 |     await deleteButton.click();
  375 |     await page.waitForTimeout(1000);
  376 | 
  377 |     // Confirm delete in modal
  378 |     const confirmDeleteBtn = page.locator('button:has-text("删除"), button:has-text("Delete")').last();
  379 |     if (await confirmDeleteBtn.isVisible()) {
  380 |       await confirmDeleteBtn.click();
  381 |       await page.waitForTimeout(3000);
  382 |     }
  383 |   }
  384 | });
  385 | 
  386 | // ============================================
  387 | // Test 13: Logout works and clears session
  388 | // ============================================
  389 | test('13. Logout works and clears session', async ({ page }) => {
  390 |   // Login first
  391 |   const loggedIn = await login(page);
  392 |   if (!loggedIn) {
  393 |     test.skip(true, 'Cannot login - check ADMIN_PASSWORD');
  394 |   }
  395 | 
  396 |   // Clear session via logout
  397 |   await page.evaluate(() => {
  398 |     sessionStorage.clear();
  399 |     localStorage.clear();
  400 |   });
  401 |   await page.goto('/admin/login', { timeout: 15000 });
  402 |   await page.waitForLoadState('domcontentloaded');
  403 | 
  404 |   // Try to access admin page - should redirect to login or show login page
  405 |   await page.goto('/admin', { timeout: 15000 });
  406 |   await page.waitForLoadState('domcontentloaded');
  407 | 
  408 |   const currentUrl = page.url();
  409 |   // Either redirected to login or session cleared - test passes if on a valid page
  410 |   expect(currentUrl).toBeTruthy();
  411 | });
  412 | 
  413 | // ============================================
  414 | // Test 14: Rate limiting on login (6 wrong passwords)
  415 | // ============================================
  416 | test('14. Rate limiting on login - 6 wrong passwords', async ({ page }) => {
  417 |   await page.goto('/admin/login', { timeout: 15000 });
  418 |   await page.waitForLoadState('domcontentloaded');
  419 | 
  420 |   // Try 6 wrong passwords
  421 |   for (let i = 0; i < 6; i++) {
  422 |     await page.fill('input[type="password"]', `wrongpassword${i}`);
  423 |     await page.click('button[type="submit"]');
  424 |     await page.waitForTimeout(500);
  425 |   }
  426 | 
  427 |   await page.waitForTimeout(1000);
  428 |   await page.waitForLoadState('domcontentloaded');
  429 | 
  430 |   // After 6 wrong attempts, check for rate limit message
  431 |   const bodyText = await page.locator('body').textContent();
  432 |   const hasRateLimitMessage =
  433 |     bodyText?.includes('Too many') ||
  434 |     bodyText?.includes('太多') ||
  435 |     bodyText?.includes('rate limit') ||
  436 |     bodyText?.includes('限流') ||
  437 |     bodyText?.includes('try again');
  438 | 
  439 |   // Rate limiting should be implemented
> 440 |   expect(hasRateLimitMessage).toBeTruthy();
      |                               ^ Error: expect(received).toBeTruthy()
  441 | });
  442 | 
  443 | // ============================================
  444 | // Test 15: Unauthenticated access to admin pages redirects to login
  445 | // ============================================
  446 | test('15. Unauthenticated access to admin pages redirects to login', async ({ page }) => {
  447 |   // Clear any existing session
  448 |   await page.evaluate(() => {
  449 |     sessionStorage.clear();
  450 |     localStorage.clear();
  451 |   });
  452 | 
  453 |   // Try to access admin dashboard directly
  454 |   await page.goto('/admin', { timeout: 15000 });
  455 |   await page.waitForLoadState('domcontentloaded');
  456 | 
  457 |   // Should be redirected to login or show login page
  458 |   const currentUrl = page.url();
  459 |   const isOnLoginPage =
  460 |     currentUrl.includes('/admin/login') ||
  461 |     (await page.locator('input[type="password"]').isVisible({ timeout: 3000 }).catch(() => false));
  462 | 
  463 |   expect(isOnLoginPage).toBeTruthy();
  464 | 
  465 |   // Also test products page
  466 |   await page.goto('/admin/products', { timeout: 15000 });
  467 |   await page.waitForLoadState('domcontentloaded');
  468 | 
  469 |   const productsUrl = page.url();
  470 |   const isOnLoginForProducts =
  471 |     productsUrl.includes('/admin/login') ||
  472 |     (await page.locator('input[type="password"]').isVisible({ timeout: 3000 }).catch(() => false));
  473 | 
  474 |   expect(isOnLoginForProducts).toBeTruthy();
  475 | });
  476 | 
  477 | // ============================================
  478 | // Test 16: Analytics page is accessible after login
  479 | // ============================================
  480 | test('16. Analytics page is accessible after login', async ({ page }) => {
  481 |   const loggedIn = await login(page);
  482 |   if (!loggedIn) {
  483 |     test.skip(true, 'Cannot login - check ADMIN_PASSWORD');
  484 |   }
  485 | 
  486 |   await page.goto('/admin/analytics', { timeout: 15000 });
  487 |   await page.waitForLoadState('domcontentloaded');
  488 | 
  489 |   // Should load without error
  490 |   const currentUrl = page.url();
  491 |   expect(currentUrl).toContain('/admin/analytics');
  492 | });
  493 | 
  494 | // ============================================
  495 | // Test 17: API endpoints have security headers
  496 | // ============================================
  497 | test('17. API endpoints have security headers', async ({ request }) => {
  498 |   const response = await request.get(`${BASE_URL}/api/products`);
  499 | 
  500 |   // Check for security headers
  501 |   const headers = response.headers();
  502 | 
  503 |   // X-Content-Type-Options should be nosniff
  504 |   expect(headers['x-content-type-options']).toBe('nosniff');
  505 | 
  506 |   // X-Frame-Options should be DENY
  507 |   expect(headers['x-frame-options']).toBe('DENY');
  508 | });
  509 | 
  510 | // ============================================
  511 | // Test 18: Dashboard navigation to Products and Blog works
  512 | // ============================================
  513 | test('18. Dashboard navigation to Products and Blog works', async ({ page }) => {
  514 |   const loggedIn = await login(page);
  515 |   if (!loggedIn) {
  516 |     test.skip(true, 'Cannot login - check ADMIN_PASSWORD');
  517 |   }
  518 | 
  519 |   // Navigate to Products
  520 |   await page.click('a[href="/admin/products"], text=产品');
  521 |   await page.waitForURL('**/admin/products', { timeout: 10000 });
  522 |   await expect(page.locator('text=产品管理')).toBeVisible({ timeout: 5000 });
  523 | 
  524 |   // Navigate back to Dashboard
  525 |   await page.goto('/admin', { timeout: 15000 });
  526 | 
  527 |   // Navigate to Blog
  528 |   await page.click('a[href="/admin/blog"], text=博客');
  529 |   await page.waitForURL('**/admin/blog', { timeout: 10000 });
  530 |   await expect(page.locator('text=博客管理')).toBeVisible({ timeout: 5000 });
  531 | });
  532 | 
```