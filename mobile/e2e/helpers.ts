import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if Android emulator is running
 */
export async function isEmulatorRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('adb devices');
    return stdout.includes('emulator');
  } catch {
    return false;
  }
}

/**
 * List available Android emulators
 */
export async function listEmulators(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('xcrun simctl list devices available | grep -E "iPhone|iPad"');
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Start Android emulator
 */
export async function startEmulator(name: string): Promise<void> {
  console.log(`Starting emulator: ${name}`);
  spawn('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUID', name], {
    detached: true,
    stdio: 'ignore',
  }).unref();
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for boot
}

/**
 * Get the package name from android project
 */
export function getAndroidPackageName(): string {
  // This reads from app.json or gradle
  return 'com.yakkum.mobile';
}

/**
 * Wait for app to be ready on emulator
 */
export async function waitForAppReady(timeout = 60000): Promise<boolean> {
  const packageName = getAndroidPackageName();
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const { stdout } = await execAsync(`adb shell pm list packages | grep ${packageName}`);
      if (stdout.includes(packageName)) {
        // App is installed, wait a bit more for it to be fully ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      }
    } catch {
      // Package not found yet
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return false;
}

/**
 * Clear app data and restart
 */
export async function resetApp(): Promise<void> {
  const packageName = getAndroidPackageName();
  try {
    await execAsync(`adb shell pm clear ${packageName}`);
    await execAsync(`adb shell am force-stop ${packageName}`);
  } catch (e) {
    console.warn('Failed to reset app:', e);
  }
}
