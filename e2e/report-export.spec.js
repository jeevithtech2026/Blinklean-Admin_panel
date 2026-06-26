import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Report Export E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log in and navigate to analytics page
    await page.goto('http://localhost:5174/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:5174/dashboard/logistics');
    await page.waitForURL('**/logistics');
  });

  test('should trigger and verify CSV report download', async ({ page }) => {
    // 1. Confirm page load
    await expect(page.locator('h1')).toContainText('Logistics & Scrap Analytics');

    // 2. Setup download listener and click the CSV export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;

    // 3. Assert filename signature matching 'scraps_report_YYYY-MM-DD_HH-MM-SS.csv'
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^scraps_report_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);

    // 4. Download file to temporary path
    const tempPath = await download.path();
    expect(tempPath).not.toBeNull();

    // 5. Read CSV contents and verify headers and rows structure
    const fileContent = fs.readFileSync(tempPath, 'utf8');
    const rows = fileContent.split('\n').map(row => row.trim()).filter(row => row.length > 0);

    // Assert CSV headers
    expect(rows[0]).toContain('date');
    expect(rows[0]).toContain('weight');

    // Assert row entry structures
    expect(rows.length).toBeGreaterThan(1);
    const firstDataRow = rows[1].split(',');
    // Date format verification: YYYY-MM-DD
    expect(firstDataRow[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Weight format verification: digits
    expect(Number(firstDataRow[1])).not.toBeNaN();
  });
});
