# E2E Testing with Playwright

This directory contains Playwright end-to-end tests for the Yakkum mobile app.

## Prerequisites

1. **Node.js 18+** and npm
2. **Android SDK** (for Android emulator testing)
3. **Playwright browsers** installed

## Setup

```bash
# Install dependencies (if not already)
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

## Running Tests

### Web Testing (fastest, no emulator needed)
```bash
npm run test:e2e:web
```

### Android Emulator Testing
```bash
# Start Android emulator first
# Then run tests
npm run test:e2e:android
```

### All Tests
```bash
npm run test:e2e
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

## Environment Variables

Create a `.env` file for test credentials:

```bash
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
```

Or set them when running:
```bash
TEST_EMAIL=test@example.com TEST_PASSWORD=pass123 npm run test:e2e
```

## Project Structure

```
e2e/
├── README.md           # This file
├── helpers.ts          # Utility functions for emulator management
├── example.spec.ts     # Sample test suite
├── page.ts             # Page Object Model (create as needed)
└── components/         # Component selectors (create as needed)
    └── login.ts
```

## Testing Flow

1. **Start Expo**: The playwright config automatically starts Expo dev server
2. **Run Tests**: Playwright connects to the running app
3. **View Results**: HTML report generated at `playwright-report/`

## Android Emulator Setup

### Using Android Studio Emulator

1. Install Android Studio from https://developer.android.com/studio
2. Create a virtual device (Pixel 6 or similar)
3. Start the emulator:
   ```bash
   # List available emulators
   emulator -list-avds

   # Start a specific emulator
   emulator @Pixel_6_API_34
   ```

### Using Command Line

```bash
# Start emulator in background
emulator @Pixel_6_API_34 &

# Wait for boot
adb wait-for-device shell getprop sys.boot_completed
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  // ... test steps
});
```

### Using Page Objects (Recommended)

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.page.locator('input[type="email"]').fill(email);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.locator('text=Masuk').click();
  }
}

// In test
test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
});
```

### Testing Native Features

For tests that need native device features (camera, GPS, etc.):

1. Use a physical device with Expo Go
2. Or use `expo prebuild` to generate a debug APK with PlaySurf testing enabled

## Troubleshooting

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if Expo dev server is running

### Cannot connect to emulator
- Ensure emulator is running: `adb devices`
- Check if app is installed: `adb shell pm list packages | grep yakkum`

### Web tests work but Android doesn't
- Android uses different selectors (React Native elements)
- Use `testId` props where possible in components
- Check accessibility labels

## CI/CD

Example GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

## Useful Links

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Expo Testing](https://docs.expo.dev/testing-overview/)
- [Playwright React Native](https://github.com/nicktorn89/react-native-playwright)
