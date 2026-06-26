import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
  test('should reject invalid credentials and login successfully with valid ones', async ({ page }) => {
    // 1. Visit login screen
    await page.goto('http://localhost:5174/login');
    
    // 2. Input invalid credentials to verify frontend form rejection
    await page.fill('#username', 'invalid_user');
    await page.fill('#password', 'wrong_pass');
    await page.click('button[type="submit"]');

    // Assert validation warning card appears
    const errorBanner = page.locator('.rounded-xl.bg-rose-50');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText('Invalid username or password');

    // 3. Clear inputs and perform a valid login sequence
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Assert that we are redirected to the dashboard page
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    
    // Assert localStorage receives the 'admin_token'
    const adminToken = await page.evaluate(() => localStorage.getItem('admin_token'));
    expect(adminToken).not.toBeNull();
    expect(adminToken).toContain('mock_admin_token_');
  });
});
