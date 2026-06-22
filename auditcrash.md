# Audit: Mobile App Crashes on Android 11 Devices

**Date:** 2026-06-11
**App:** OMMHA mobile (Expo SDK 56 / React Native 0.85.3)
**Symptom:** App crashes (or fails to install) on some Android 11 devices, while working fine on others with the same Android version.

---

## Verdict

Android 11 is **fully supported** by the build — the compiled APK has `minSdkVersion 24` (Android 7.0+), and Android 11 is API 30. The crashes are **not** an OS-version compatibility problem.

The most likely cause is the **64-bit-only (arm64-v8a) build configuration**, which breaks the app on 32-bit devices.

---

## Finding 1 (Primary): APK ships arm64-v8a native libraries only

### Evidence

The build is restricted to the arm64-v8a ABI in two places:

1. [mobile/app.json:63](mobile/app.json#L63) — `expo-build-properties`:
   ```json
   "reactNativeArchitectures": "arm64-v8a"
   ```
2. [mobile/app.json:69](mobile/app.json#L69) with [mobile/plugins/withAndroidAbiFilters.js](mobile/plugins/withAndroidAbiFilters.js) — injects into `app/build.gradle`:
   ```groovy
   ndk { abiFilters "arm64-v8a" }
   ```

### Why this crashes "some" Android 11 devices

Many budget phones common in Indonesian field deployments run a **32-bit (armeabi-v7a) Android OS image**, even when the chipset is 64-bit capable — vendors ship 32-bit builds on low-RAM devices to save memory. Typical examples: Redmi 9A/9C, Samsung Galaxy A01/A02/Go editions, low-end Oppo/Vivo models.

On a 32-bit device, an arm64-only APK either:

- fails to install ("App not installed" / `INSTALL_FAILED_NO_MATCHING_ABIS`), or
- installs but **crashes instantly at startup** with `UnsatisfiedLinkError: couldn't find libhermes.so`.

The `preview` build profile distributes a sideloaded APK ([mobile/eas.json:7-11](mobile/eas.json#L7-L11)), so there is no Play Store device filtering to hide incompatible devices. Result: the exact reported symptom — same Android version, some devices fine, some crash.

### Why it never reproduces in development

The local `mobile/android/` directory (used by `expo run:android`) still contains all four ABIs ([mobile/android/gradle.properties:31](mobile/android/gradle.properties#L31)):

```
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

But `mobile/android/` is **gitignored** ([mobile/.gitignore:42](mobile/.gitignore#L42)), so EAS regenerates the native project from `app.json` via prebuild — producing arm64-only binaries. Dev builds work everywhere; EAS builds break 32-bit devices.

### Fix

Add `armeabi-v7a` back in both places in `mobile/app.json`:

```json
"reactNativeArchitectures": "armeabi-v7a,arm64-v8a",
```

```json
["./plugins/withAndroidAbiFilters", ["armeabi-v7a", "arm64-v8a"]]
```

Then rebuild with EAS. Cost: roughly 10–15 MB larger APK.

---

## Finding 2 (Secondary): R8 minification enabled

[mobile/app.json:64-65](mobile/app.json#L64-L65):

```json
"enableMinifyInReleaseBuilds": true,
"enableShrinkResourcesInReleaseBuilds": true
```

These are non-default for Expo. R8 can strip classes that are only referenced via reflection (some React Native / Expo modules do this), causing **release-only crashes** on any Android version, on specific code paths rather than at startup.

If crashes persist after the ABI fix, disable these flags or add ProGuard keep rules for the affected modules.

---

## How to confirm on a crashing device

1. Check whether the device runs a 32-bit OS:
   ```
   adb shell getprop ro.product.cpu.abilist
   ```
   If the list contains no `arm64-v8a` → Finding 1 confirmed.
2. Capture the crash:
   ```
   adb logcat *:E
   ```
   - `UnsatisfiedLinkError` / `libhermes.so` → ABI problem (Finding 1).
   - `ClassNotFoundException` / `NoSuchMethodError` in release builds only → R8 stripping (Finding 2).
3. Collect model names of crashing devices — 32-bit models cluster on the budget tier listed above.

---

## Live production proof of the cache leak (2026-06-11)

Confirmed against `api.atlaskeswa.id` with a real account:

```
GET /v1/accounts/users/me/  (token A)            → x-dynamic-cache: MISS, then HIT, HIT
GET /v1/accounts/users/me/  (token B, different) → x-dynamic-cache: HIT   ← served from token A's entry
GET /v1/accounts/users/me/  (no token)           → 401 passes through (TTL is short)
```

The cache key ignores the `Authorization` header: a response cached for one user is served to the next user who requests the same URL within the TTL.

Observed on-device (screenshot, 2026-06-11): phone logged in as `admin@gmail.com` (full_name "Nuroji lukman Syah 2") rendered **two identities at once** — TopHeader showed "Lutfiana Putri Puspitasari (Surveyor)" (another real user's cached response) while the hero card showed the admin's own name fetched seconds later after the cache entry rolled over. Both components call the same `/accounts/users/me/` endpoint.

Production has many active users, so all authenticated GET data (profiles, dashboard stats, RBAC-filtered survey lists) cross-contaminates between users until the fix is deployed.

---

## Related finding from same session (already fixed)

Cross-user data leak: the production API (`api.atlaskeswa.id`) sits behind a dynamic cache that keyed responses on URL only, ignoring the `Authorization` header, while Django sent no `Cache-Control` headers. One user's `/v1/accounts/users/me/` (and any other GET) response could be served to another user — the cause of the wrong "Selamat Datang" name on web and mobile home.

Fixed by `APICacheControlMiddleware` ([backend/apps/accounts/middleware.py](backend/apps/accounts/middleware.py)) setting `Cache-Control: private, no-store` + `Vary: Authorization` on all `/v1/*` responses, registered first in `MIDDLEWARE` ([backend/core/settings/base.py](backend/core/settings/base.py)). Still pending: deploy backend; disable the host's dynamic cache for the API domain; web users must re-login once to refresh the cached name.
