import { test, expect } from '@playwright/test';

test.describe('Partner Filtering E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log in and navigate to partner management screen
    await page.goto('http://localhost:5174/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to Partners page
    await page.goto('http://localhost:5174/dashboard/partners');
    await page.waitForURL('**/partners');
  });

  test('should filter partner grid rows by text search and dropdown categories', async ({ page }) => {
    // 1. Confirm page load
    await expect(page.locator('h1')).toContainText('Partner Management');

    // 2. Select the search box and input filter query
    const searchInput = page.getByPlaceholder('Filter table list by Partner Name or ID...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Marcus');

    // 3. Assert table rows mutate and filter correctly
    const tableRows = page.locator('tbody tr');
    await expect(tableRows).toHaveCount(1);
    await expect(tableRows.first().locator('td').first()).toContainText('Marcus Vance');

    // 4. Clear search query
    await searchInput.fill('');
    await expect(tableRows).toHaveCount(10); // Returns to original fallback count

    // 5. Select category dropdown filter and change it
    const categoryDropdown = page.locator('#categoryFilter');
    await expect(categoryDropdown).toBeVisible();
    await categoryDropdown.selectOption('Electronic Scrap');

    // 6. Assert table rows update to show matching categories
    const categoryCells = page.locator('tbody td span:text("Electronic Scrap")');
    const totalMatchingRows = await categoryCells.count();
    expect(totalMatchingRows).toBeGreaterThan(0);
    
    // Confirm all displayed rows match the category
    const rows = await tableRows.count();
    expect(rows).toBe(totalMatchingRows);
  });
});
