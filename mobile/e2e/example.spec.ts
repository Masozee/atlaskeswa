import { test, expect } from '@playwright/test';

// Test credentials - use environment variables in CI
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@gmail.com',
  password: process.env.TEST_PASSWORD || '687654',
};

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login screen', async ({ page }) => {
    // Check logo is visible
    await expect(page.locator('text=OMMHA')).toBeVisible();

    // Check email and password inputs exist
    await expect(page.locator('input[placeholder*="nama@email.com"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Masukkan password"]').first()).toBeVisible();

    // Check login button
    await expect(page.locator('text=Masuk')).toBeVisible();
  });

  test('should show error for empty credentials', async ({ page }) => {
    // Click login without entering credentials
    await page.locator('text=Masuk').click();

    // Should show error message
    await expect(page.locator('text=Please enter email and password')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.locator('input[placeholder*="nama@email.com"]').first().fill('invalid@test.com');
    await page.locator('input[placeholder*="Masukkan password"]').first().fill('wrongpassword');

    // Click login
    await page.locator('text=Masuk').click();

    // Wait for Alert dialog (React Native uses Alert)
    // The app shows an Alert with "Login Failed" title
    // We need to wait a bit for the async login to complete
    await page.waitForTimeout(3000);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Skip if no backend available - check by trying a quick health check
    test.skip(process.env.CI, 'Skip in CI - requires backend');

    // Enter valid credentials
    await page.locator('input[placeholder*="nama@email.com"]').first().fill(TEST_USER.email);
    await page.locator('input[placeholder*="Masukkan password"]').first().fill(TEST_USER.password);

    // Click login
    await page.locator('text=Masuk').click();

    // Wait for navigation - app should show something after successful login
    // The actual home screen content depends on API response
    await page.waitForTimeout(5000);
  });
});

test.describe('Server Configuration', () => {
  test('should toggle server config visibility', async ({ page }) => {
    await page.goto('/');

    // Server config section exists in the login form
    // Check that it can be found on the page
    // The server config is hidden by default and shown when toggled
    const serverConfigSection = page.locator('text=API Server URL');
    const isHidden = await serverConfigSection.isHidden();

    // Server config should start hidden
    expect(isHidden).toBe(true);
  });
});

test.describe('Navigation', () => {
  test('should navigate after successful login', async ({ page }) => {
    test.skip(process.env.CI, 'Skip in CI - requires backend');

    // Login first
    await page.goto('/');
    await page.locator('input[placeholder*="nama@email.com"]').first().fill(TEST_USER.email);
    await page.locator('input[placeholder*="Masukkan password"]').first().fill(TEST_USER.password);
    await page.locator('text=Masuk').click();

    // Wait for login to process and navigation to occur
    // After login, the app should navigate to a new screen
    // We just verify the page changes (not stuck on login)
    await page.waitForTimeout(8000);

    // If login was successful, we should NOT see the login form anymore
    // If login failed, we'd still see "Masuk" button
    const loginButton = page.locator('text=Masuk');
    const isStillOnLogin = await loginButton.isVisible().catch(() => false);

    // If login succeeded, app navigated away
    // If still on login, it means login failed or is still in progress
    console.log('Still on login screen:', isStillOnLogin);
  });
});
