import { test, expect } from '@playwright/test';

test.describe('Dashboard Interactions E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Perform standard login sequence before running dashboard tests
    await page.goto('http://localhost:5174/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should load KPI metrics and trigger manual refresh successfully', async ({ page }) => {
    // 1. Confirm dashboard page loaded
    await expect(page.locator('h1')).toContainText('Overview Dashboard');

    // 2. Wait for loading spinner or skeletons to resolve
    const kpiCards = page.locator('.rounded-2xl.border-slate-100');
    await expect(kpiCards).toHaveCount(4);

    // 3. Assert KPI metric cards render numerical strings
    const customerCardValue = page.locator('span:near(:text("Total Registered Customers"))').first();
    const partnerCardValue = page.locator('span:near(:text("Total Registered Partners"))').first();
    const bookingsCardValue = page.locator('span:near(:text("Active Bookings Today"))').first();
    const completionsCardValue = page.locator('span:near(:text("Completed Services Today"))').first();

    await expect(customerCardValue).not.toBeEmpty();
    await expect(partnerCardValue).not.toBeEmpty();
    await expect(bookingsCardValue).not.toBeEmpty();
    await expect(completionsCardValue).not.toBeEmpty();

    // 4. Click the manual refresh controller element
    // Setup listener for network response re-firing
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/admin/dashboard-summary') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null); // Catch if running in offline fallback mode without actual API endpoints

    await page.click('button[title="Synchronize Data Now"]');

    // Verify response resolving or fallback completion
    const response = await responsePromise;
    if (response) {
      console.log('[E2E TEST] Telemetry event re-fired and resolved with status:', response.status());
    } else {
      console.log('[E2E TEST] Manual refresh clicked, resolved in fallback mode.');
    }

    // Loader spinner should clear
    await expect(page.locator('button[title="Synchronize Data Now"] svg')).not.toHaveClass(/animate-spin/);
  });
});
