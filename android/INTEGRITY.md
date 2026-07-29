# RKSK App / Device Integrity

This document is the reference for the L1 audit finding **F-13 — No root
/ tamper / emulator / Play Integrity detection**. It covers:

1. what integrity signals RKSK evaluates today, on-device, at every boot,
2. how those signals map to `ok` / `warn` / `block` verdicts and to UI,
3. the roadmap to add server-verified Play Integrity attestation (the
   second half of F-13, blocked on a backend endpoint being available),
4. the intentional limits of client-side integrity checks and how to
   test the current implementation.

## Where the code lives

| File | Role |
| --- | --- |
| `src/utils/security/integrity.js` | Runs the checks, classifies the verdict (`ok` / `warn` / `block`), caches it for the session. |
| `src/utils/security/bootstrap.js` | Hydrates the integrity verdict during app boot, alongside the Keychain hydration from F-04. |
| `src/App.js` | Renders a block screen or a warn-and-continue screen based on the verdict; only after `ok` or an acknowledged warn does it mount the redux store and route into the app. |

## What we detect

All of the following are evaluated inside `evaluateIntegrity()` in
`src/utils/security/integrity.js`. Every check is defensive — if the
underlying library throws or is missing the field is recorded as
`null` and the classification treats the signal as unknown.

| Signal | Source | Detects |
| --- | --- | --- |
| `isRooted` | `JailMonkey.isJailBroken` (backed by rootBeer + `su` probes) | Magisk / KingRoot / SuperSU / Kingo Root / `su` binary present / test-keys ROM |
| `isHookDetected` | `JailMonkey.hookDetected` | Frida server / Xposed / Substrate / EdXposed / LSPosed |
| `canMockLocation` | `JailMonkey.canMockLocation` | Device configured to allow mock GPS via developer options |
| `isDebuggerAttached` | `JailMonkey.isDebuggedMode` | JDWP debugger, gdb, lldb, or an IDE currently attached to the app process |
| `isDevSettingsEnabled` | `JailMonkey.isDevelopmentSettingsMode` | Android "Developer options" toggled on |
| `isOnExternalStorage` | `JailMonkey.isOnExternalStorage` | APK installed to `/mnt/asec/*` or `/mnt/expand/*` (SD card / expandable storage) |
| `isAdbEnabled` | `JailMonkey.AdbEnabled` | USB debugging (`adb`) enabled in developer options |
| `isEmulator` | `DeviceInfo.isEmulator()` | Genymotion / Android Studio AVD / BlueStacks / NoxPlayer / etc. |
| `isSideloaded` | `DeviceInfo.getInstallerPackageName()` cross-referenced against `TRUSTED_INSTALLER_PACKAGES` | APK installed from anywhere other than Play Store / stock installer / OEM store |

## How verdicts are classified

The classifier lives at the bottom of `evaluateIntegrity()`. Categories,
in order of precedence:

### Category 1 — always `block` (no dev-build override)

These signals have essentially zero false-positive rate on a normal
device. If we see them, the environment is intentionally instrumented
and rendering the app anyway would leak PII / JWT / camera captures to
someone actively watching for them.

- `isHookDetected` → `hook_framework_detected`
- `isOnExternalStorage` → `app_running_from_external_storage`

### Category 2 — `block` in release, `warn` in dev

These are legitimate on a developer machine but not on a field
ASHA-worker device. `__DEV__` is `true` for Metro-served bundles and
`false` for release APKs, so the distinction is automatic.

- `isRooted` → `rooted_device`
- `isDebuggerAttached` → `debugger_attached`

### Category 3 — always `warn` (never `block`)

Informational signals we surface to the user but never hard-fail on,
because they fire on perfectly legitimate devices too often:

- `isEmulator` — sometimes used for internal training / QA on real APKs
- `isAdbEnabled` (release only) — some OEM support flows require ADB
- `isDevSettingsEnabled` (release only) — some accessibility settings
  are only reachable through developer options
- `canMockLocation` — the *capability* alone doesn't mean it's being
  used; the per-request mock-location check on the location submission
  endpoint is where this signal should turn into a block
- `isSideloaded` (release only) — enterprise MDMs push APKs via
  non-standard installers; blocking would lock legit deployments out

If ANY category-3 signal is `true` and no category-1 or -2 signal
fired, the verdict is `warn`. The UI shows the user which signal(s)
tripped and asks them to acknowledge before continuing. Acknowledgement
is per-session; killing the app re-runs the check.

## What the user sees

`src/App.js` renders one of three states depending on the verdict:

- **`ok`** — normal. The redux `Provider` mounts, `PersistGate` waits
  for redux-persist rehydration, and `<Route />` takes over.
- **`warn`** — a full-screen splash with `Security warning`, the list
  of tripped signals in plain English, and a single button
  `I understand, continue`. Continuing sets the local acknowledgement
  flag; subsequent renders in the same session skip the splash.
- **`block`** — a full-screen splash with `Cannot run on this device`,
  the list of signals, and a `Retry check` button. `Retry check` calls
  `IntegrityService.reset()` and re-runs the bootstrap — useful if the
  user (or admin) has just resolved the underlying issue.

At no point in `block` state is the redux store instantiated. Because
the store's construction is lazy (see F-04's `makeLazyProxy` pattern),
this means:

- no persisted PII is decrypted into memory on a blocked device,
- no API interceptors register,
- no background sync tasks fire.

## Play Integrity API — the second layer (planned)

Client-side checks catch drive-by attackers. A sophisticated attacker
with a rooted device can hook `isJailBroken` itself and return `false`,
which is why every mature mobile app also runs server-verified
attestation.

The industry-standard mechanism is Google's **Play Integrity API**.
Flow, at 30,000 ft:

```
┌────────────┐  1. request nonce         ┌─────────────┐
│            │ ────────────────────────► │             │
│  RKSK app  │                           │  RKSK API   │
│            │ ◄──────────────────────── │  backend    │
│            │  2. nonce (from server)   │             │
└─────┬──────┘                           └─────▲───────┘
      │                                        │
      │ 3. Play Integrity                      │
      │    .requestIntegrityToken(nonce)       │
      │                                        │
      ▼                                        │
┌───────────────┐                              │
│ Google Play   │                              │
│ Services      │                              │
│ (device-side) │                              │
└─────┬─────────┘                              │
      │                                        │
      │ 4. signed integrity token              │
      │                                        │
      ▼                                        │
┌────────────┐                                 │
│  RKSK app  │  5. sensitive request           │
│            │     + X-Play-Integrity: <token> │
│            │ ──────────────────────────────► │
└────────────┘                                 │
                                               │  6. Google decode endpoint
                                        ┌──────▼──────────────────────┐
                                        │ playintegrity.googleapis.com │
                                        │ /v1/<pkg>:decodeIntegrityToken │
                                        └──────┬───────────────────────┘
                                               │
                                               │  7. { appRecognitionVerdict:
                                               │       "PLAY_RECOGNIZED",
                                               │      deviceRecognitionVerdict:
                                               │       ["MEETS_STRONG_INTEGRITY"] }
                                               │
                                        ┌──────▼───────┐
                                        │  RKSK API    │
                                        │  gate on     │
                                        │  verdict     │
                                        └──────────────┘
```

Google's verdict tells the backend three things:

- **`appRecognitionVerdict`** — is the calling app the one published to
  Play, with the same signing key? Any value other than
  `"PLAY_RECOGNIZED"` means the APK was repackaged / resigned.
- **`deviceRecognitionVerdict`** — a list of labels: `"MEETS_STRONG_INTEGRITY"`
  (secure boot + verified boot + unlocked bootloader = false),
  `"MEETS_DEVICE_INTEGRITY"` (weaker), `"MEETS_BASIC_INTEGRITY"`
  (weakest), or an EMPTY list (device compromised / emulator).
- **`accountDetails.appLicensingVerdict`** — did the calling account
  actually purchase / install the app from Play? Redundant for a free
  app but useful for future paid tiers.

The client-side + server-side split is:

- **Client-side (this session, done):** run local heuristics, block
  drive-by attackers, cache verdict, refuse to mount PII into memory.
- **Client-side (deferred until backend ready):** call
  `PlayIntegrity.requestIntegrityToken(nonce)`, attach to sensitive
  requests as `X-Play-Integrity-Token`.
- **Backend (out of scope for the mobile team):** provide a
  `POST /api/integrity/nonce` endpoint that returns a fresh
  server-signed nonce; consume the header on sensitive endpoints;
  call Google's `decodeIntegrityToken` endpoint; reject the request
  if either verdict is missing / weak.

### Wiring the Play Integrity client library, later

When the backend contract lands, install ONE of the following (in
preference order):

1. **`@pagopa/io-react-native-integrity`** — MIT, actively maintained
   by an Italian government team, pure bare-RN native module (no Expo
   modules layer). Covers Play Integrity + iOS App Attest.
2. **`@expo/app-integrity`** — official Expo library. Requires
   `expo-modules-core` in a bare RN project, which is a heavy add but
   very well-tested.

Then create `src/utils/security/playIntegrity.js` that exports:

```js
export async function attestSensitiveRequest(nonce) { … }
```

…and add it to the axios interceptor in `src/utils/apicalls/index.js`
for the endpoints that carry PII (login, form submits).

Do NOT bundle either library before the backend endpoint is live. A
library that generates tokens no server verifies is worse than nothing:
it burns Play Integrity quota (500k requests / day is the free tier),
inflates the APK, and creates the illusion of a control that isn't
actually enforcing anything.

## Bypass considerations (do not oversell this to auditors)

- **Every client-side check is theoretically bypassable.** A rooted
  device with Magisk Hide + Frida can null every one of the JailMonkey
  probes. If your threat model is "sophisticated attacker with physical
  access", the client-side layer buys you nothing — only server-side
  Play Integrity does.
- **Magisk Hide (and its successor Zygisk) IS effective against
  rootBeer.** rootBeer is a probe-based library, not a kernel-level
  detector. If Magisk Hide masks the `su` binary and `/system/xbin`
  writability, `isJailBroken` returns `false`.
- **Frida can be run in "detached" mode without the `frida-server` binary
  the JailMonkey hookDetected probe looks for.** For example, Frida
  Gadget compiled into a repackaged APK evades this signal entirely.
  (Play Integrity's `appRecognitionVerdict != "PLAY_RECOGNIZED"` catches
  the repackaging.)
- **Emulator detection is a game of whack-a-mole.** BlueStacks 5,
  MEmu Play, and Waydroid all present as "real device" to shallow
  checks. `DeviceInfo.isEmulator()` handles the obvious ones; anything
  more sophisticated needs Play Integrity's `MEETS_DEVICE_INTEGRITY`.

The client-side layer's real job is:

- deter drive-by malware / opportunistic attackers,
- prevent the app from running in obviously-instrumented QA environments
  that shouldn't be handling real health records,
- **create an audit trail** — the verdict object is meant to be logged
  server-side so post-incident forensics can see "yes, this session
  reported `warn: mock_location_capable, adb_enabled_on_release` and
  we still processed a form submission — that submission is suspect".

## Testing

### Positive path (clean release build)

```bash
# Install release APK on a non-rooted physical device.
adb install -r android/app/build/outputs/apk/release/app-arm64-v8a-release.apk

# Launch. Expect: no security splash, straight to login.
adb shell am start -n com.rkskmp/.MainActivity

# Inspect the verdict programmatically via the JS console (dev builds):
# In Chrome DevTools Metro debugger:
#   IntegrityService.getVerdict()
# Should return { checks: {...all false...}, riskLevel: 'ok', reasons: [] }
```

### Blocked path — hook framework

Easiest reproducible test: install Frida-server via ADB and re-launch
the release APK.

```bash
# On the host, download the frida-server matching the device arch from
# https://github.com/frida/frida/releases/ .
adb push frida-server-<ver>-android-arm64 /data/local/tmp/frida-server
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "/data/local/tmp/frida-server &"

# Launch RKSK. Expect: "Cannot run on this device" splash with
# "A dynamic instrumentation tool (Frida / Xposed / Substrate) is
# running on this device."
adb shell am start -n com.rkskmp/.MainActivity

# Kill frida-server; hit "Retry check" in the app UI. Expect: normal boot.
adb shell "killall frida-server"
```

### Blocked path — rooted device

Requires a rooted Android device or an AVD image with Magisk installed.
On such a device, install the RELEASE (not debug) APK. Expect
`rooted_device` in the block splash. On the same device, if you install
the DEBUG APK instead, expect a `warn` splash with the same reason.

### Warn path — emulator

Install the release APK on an Android Studio AVD:

```bash
# From Android Studio → AVD Manager, start any x86_64 image.
adb -s emulator-5554 install -r \
    android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
adb -s emulator-5554 shell am start -n com.rkskmp/.MainActivity
```

Expect the `warn` splash with `running_on_emulator`. Click "I understand,
continue" — expect normal boot on the next render.

### Unit-testing the classifier

`src/utils/security/integrity.js` is pure logic on top of a mockable
JailMonkey. A minimal test:

```js
// src/utils/security/__tests__/integrity.test.js (not committed yet)
jest.mock('jail-monkey', () => ({
  isJailBroken: false,
  hookDetected: true,
  // ...
}));
jest.mock('react-native-device-info', () => ({
  isEmulator: () => false,
  getInstallerPackageName: () => 'com.android.vending',
}));

import { evaluateIntegrity } from '../integrity';

test('hookDetected triggers block', async () => {
  const v = await evaluateIntegrity();
  expect(v.riskLevel).toBe('block');
  expect(v.reasons).toContain('hook_framework_detected');
});
```

## Failure modes / operational gotchas

- **JailMonkey autolinking issue** — if `npm install` runs cleanly but
  the native module fails to link (e.g. AGP compileSdk mismatch), the
  bootstrap logs `[security] integrity check failed: ...` and the
  cached verdict stays `null`. The UI treats null as "ok" and lets the
  user proceed. This is a deliberate fallback — we do not want a build
  regression in the security library to lock every user out of the app.
- **A device that stays permanently in `warn` because of ADB.** ANM /
  ASHA workers whose device is centrally managed via ADB will see the
  warn splash on every launch. If this is disruptive, promote the ADB
  signal to a per-session-cached ignore or add an MDM-signed allowlist
  header on the API side.
- **False-positive rooted detection on some OnePlus / Xiaomi builds.**
  rootBeer's `checkForDangerousProps` fires on `ro.debuggable=1`, which
  some OEM ROMs ship. If field reports show a specific model always
  flagged, add a targeted allowlist in `evaluateIntegrity()` using
  `DeviceInfo.getBrand() + getModel()` — but document the exception
  loudly and treat it as tech debt to fix at the rootBeer library
  layer, not a permanent workaround.
