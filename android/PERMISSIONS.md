# Android Permissions Inventory (F-14 + F-23)

This document is the canonical inventory of Android permissions declared,
transitively injected, or explicitly stripped by RKSK-MP. Every entry
here should map 1:1 to a `<uses-permission>` line (or a `tools:node="remove"`
strip) in `android/app/src/main/AndroidManifest.xml`.

If you add, remove, or narrow a permission, update this file in the same
commit. The release-build Gradle guard in `android/app/build.gradle`
(§`mergedManifestStripRegistry`) enforces the strip list; the audit
below documents the "why" for reviewers.

Related findings:
* **F-14** — WRITE/READ_EXTERNAL_STORAGE without `maxSdkVersion` (fixed).
* **F-23** — Over-broad background / silent-download permissions (fixed).

---

## 1. Threat model

An Android permission is a capability grant. Two independent risks
attach to every grant:

1. **Runtime abuse** — code in the app (or in a transitive dependency,
   or an attacker who obtains code-execution via another CVE) can call
   the API guarded by the permission. `DOWNLOAD_WITHOUT_NOTIFICATION`
   is the textbook example: possessing it lets any code path issue a
   silent DownloadManager request that hides progress from the user.
2. **Signalling / trust erosion** — the Play Store listing exposes the
   permission grant surface to users, and Google Play's pre-launch
   report treats over-broad permissions as a review flag. Even if the
   permission is not used at runtime, holding it burns user trust and
   escalates the app in Play Console risk assessments.

Both risks are addressed by minimising the granted surface. When a
permission is unavoidable (e.g., `INTERNET`), documenting the
justification here provides an audit trail and a review checkpoint for
future changes.

---

## 2. Permission classes

Android permissions fall into four protection levels. Different rules
apply to each:

| Level | Requires runtime prompt? | Play Store surface |
|-------|--------------------------|---------------------|
| `normal` | No — auto-granted | Not shown to user |
| `dangerous` | Yes — must be requested via `PermissionsAndroid.request()` | Shown as capability grant |
| `signature` | No — auto-granted only if signed with same cert as declarer | Not shown |
| `signatureOrSystem` | No — same as signature, or bundled with system image | Not shown |

RKSK holds `INTERNET` (normal), `ACCESS_FINE_LOCATION` +
`ACCESS_COARSE_LOCATION` + `CAMERA` (dangerous — user-visible), the
media-picker permissions (`READ_MEDIA_*`, dangerous on API 33+), and
several `normal` permissions to support foreground-service data sync.
No `signature` or `signatureOrSystem` permissions are held.

---

## 3. Declared permissions — full inventory

Each entry maps to a line (or block) in `AndroidManifest.xml`. The
"Justification" column explains why the permission is genuinely needed
by RKSK; "Runtime path" points to the code that exercises it.

### Foreground / user-visible

| Permission | Protection | Justification | Runtime path |
|------------|------------|---------------|--------------|
| `INTERNET` | normal | Networking for backend API calls and TLS. | `src/utils/apicalls/index.js`, every fetch call |
| `ACCESS_FINE_LOCATION` | dangerous | Health-worker uses map / geocoding for visit tracking (ATP form location capture). | `src/hooks/useLocation.js`, `src/hooks/useLocationStatus.js` |
| `ACCESS_COARSE_LOCATION` | dangerous | Requested alongside FINE for fallback / accuracy negotiation. | Same as above |
| `CAMERA` | dangerous | Form-attached photo capture (`react-native-image-picker`) and QR scanning (`react-native-vision-camera` / `react-native-camera-kit` if enabled). | `src/screens/*` picker flows |

### Media (API 33+ per-media replacement for `READ_EXTERNAL_STORAGE`) — F-14

| Permission | Protection | Justification | Runtime path |
|------------|------------|---------------|--------------|
| `READ_MEDIA_IMAGES` | dangerous | Image picker on API 33+ requires the granular per-media permission. Requested at runtime in `src/route/index.js`. | Image-picker screens |
| `READ_MEDIA_VIDEO` | dangerous | Video attachment picker (peer educator brigade activity video evidence) on API 33+. | Video-picker screens |

`READ_MEDIA_AUDIO` is intentionally NOT declared — the app has no
audio-file read use case, and adding it would enlarge the grant
surface without justification.

### Legacy storage — F-14 scoped

| Permission | Protection | Justification | Scope |
|------------|------------|---------------|-------|
| `WRITE_EXTERNAL_STORAGE` | dangerous | Legacy pre-scoped-storage path for API 19-28. Post-API-29 the app uses `DownloadManager` (which does not require the permission) and scoped external-files-dir (app-private). | `android:maxSdkVersion="28"` |
| `READ_EXTERNAL_STORAGE` | dangerous | Legacy shared-storage reads on API 24-32. Superseded by `READ_MEDIA_*` on API 33+. | `android:maxSdkVersion="32"` |

Both carry `tools:replace="android:maxSdkVersion"` to prevent
transitive libraries (`react-native-blob-util`, `react-native-fs`)
from silently unscoping the permission via manifest-merger conflict
resolution.

### Background sync

| Permission | Protection | Justification | Notes |
|------------|------------|---------------|-------|
| `FOREGROUND_SERVICE` | normal | Umbrella API-28+ permission for `startForeground(...)`. Required for the `RNBackgroundActionsTask` service. | |
| `FOREGROUND_SERVICE_DATA_SYNC` | normal | API-34+ requirement: the declared `foregroundServiceType="dataSync"` MUST have a matching permission or the service is refused at start time. | See §4 for policy analysis |
| `WAKE_LOCK` | normal | Keeps the CPU alive during offline-form upload / master-data download so OkHttp connect/read timeouts don't fire when the screen sleeps mid-sync. | Held by react-native-background-actions |
| `POST_NOTIFICATIONS` | dangerous (API 33+) | Foreground services must show a persistent notification; API 33+ requires runtime permission for that notification even if the service is running in the foreground. | Requested via `PermissionsAndroid.request()` at first-run |

### Network status

| Permission | Protection | Justification | Injected by |
|------------|------------|---------------|-------------|
| `ACCESS_NETWORK_STATE` | normal | Sync loop only runs when connectivity is present (`NetInfo.fetch()` in `backgroundService.js:76`). | `@react-native-community/netinfo` — transitive but genuinely needed |
| `ACCESS_WIFI_STATE` | normal | NetInfo distinguishes wifi vs cellular connections; some sync paths behave differently based on link type. | `@react-native-community/netinfo` |

### Install / Play Services

| Permission | Protection | Justification | Injected by |
|------------|------------|---------------|-------------|
| `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE` | signature | Play Store install-referrer API (attribution). Required by `com.google.android.gms:play-services-base`. | `play-services-base` transitive |
| `com.rkskmp.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | signature (auto-generated) | Android 14+ receiver export policy — AndroidX Core generates a self-signed permission at build time to enforce `RECEIVER_NOT_EXPORTED` on dynamic broadcast receivers. Cannot be used by other apps. | `androidx.core:core` transitive |

---

## 4. Foreground-service type: `dataSync`

Google's Android 14+ (API 34) foreground-service policy requires every
`Service.startForeground(...)` call to declare a matching
`android:foregroundServiceType` in the manifest. RKSK's
`RNBackgroundActionsTask` declares `foregroundServiceType="dataSync"`.

### Why `dataSync` is the correct type

Per [developer.android.com/about/versions/14/changes/fgs-types-required](https://developer.android.com/about/versions/14/changes/fgs-types-required),
`dataSync` is the type for:

> Data transfer operations, such as:
> - Uploading or downloading data over the network
> - Backup and restore operations
> - Import or export operations
> - Fetching data
> - Local file processing
> - Transferring data between a device and the cloud over a network.

RKSK's `backgroundService.js` performs exactly these operations:

1. **Uploads** offline-captured form data (ATP forms, Peer Educator
   forms, Peer Brigade forms, Referral forms) to the backend when
   connectivity returns.
2. **Downloads** master data lists (peer educator list, brigade list,
   IEC material, awareness videos, referral catalog) for offline use.
3. **Refreshes** the user profile from the backend.

Every sync cycle updates a persistent user-visible notification with a
human-readable description of the current step, so the workload is
transparent to the user.

### Why not other types

| Type | Would we qualify? | Verdict |
|------|-------------------|---------|
| `location` | No — sync doesn't collect location while backgrounded | N/A |
| `mediaPlayback` | No — no audio/video playback | N/A |
| `camera` / `microphone` | No — no background capture | N/A |
| `health` | No — no health-sensor readings | N/A |
| `mediaProcessing` | Debatable — video-compression happens on the main JS thread, not in the service | Not a match; would misrepresent the workload |
| `shortService` | No — sync runs longer than 3 min in worst case | Would trigger `ForegroundServiceStartNotAllowedException` |
| `specialUse` | Requires `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" .../>` and explicit Play Console review | Only appropriate when no other type fits |

`dataSync` is the unambiguous match.

### Android 15 (API 35) quota

Android 15 introduces a **6-hour daily quota** on `dataSync` and
`mediaProcessing` foreground-service execution. RKSK's sync loop is
intermittent — the `checkIfSyncPending()` path calls
`stopAllBackgroundServices()` once all queues drain, and the loop
sleeps between passes. In realistic field use the service runs for
seconds to minutes at a time, well under the quota.

If future product changes turn the sync loop into a persistent
poller, revisit this choice. `WorkManager`'s periodic `WorkRequest`
API is exempt from the foreground-service quota and would be the
correct migration target.

---

## 5. Stripped permissions — F-23

The following four permissions were transitively injected by
third-party AARs but are **removed** from the final merged manifest
via `tools:node="remove"` directives in
`android/app/src/main/AndroidManifest.xml`. The release-build Gradle
guard in `android/app/build.gradle` (§`mergedManifestStripRegistry`)
verifies each strip on every release build.

### 5.1 DOWNLOAD_WITHOUT_NOTIFICATION

**Source AAR:** `react-native-blob-util` — declared unconditionally at
`node_modules/react-native-blob-util/android/src/main/AndroidManifest.xml:24`.

**Capability granted:** Lets an app enqueue a `DownloadManager.request(...)`
that hides progress from the user. Combined with `INTERNET`, this is
the classic silent-download / silent-exfiltration primitive.

**Why RKSK doesn't need it:** The only DownloadManager caller in the
app is `downloadFile()` at `src/utils/helper.js:493`, which invokes:

```javascript
ReactNativeBlobUtil.config({
  useDownloadManager: true,
  // no `notification: false` — the user sees the DownloadManager
  // notification with progress and a Cancel button
})
```

Without `notification: false`, `DownloadManager` shows its standard
progress notification, which requires no additional permission on the
app side. The `DOWNLOAD_WITHOUT_NOTIFICATION` permission is dead
weight.

**Regression signal:** If a future refactor legitimately needs silent
downloads (unlikely for a health-worker app), delete the removal block
in `AndroidManifest.xml` AND update this section with the new use
case.

### 5.2 RECEIVE_BOOT_COMPLETED

**Source AAR:** `androidx.work:work-runtime:2.9.1` — pulled in
transitively by `react-native-maps`.

**Capability granted:** Allows a `BroadcastReceiver` to receive
`android.intent.action.BOOT_COMPLETED` when the device finishes
booting. Enables auto-start on device power-on.

**Why RKSK doesn't need it:** WorkManager on API ≥ 23 delegates to
`JobScheduler`, which persists work items across reboots natively —
no boot receiver required. WorkManager only uses the
`BOOT_COMPLETED` path on API < 23 to reschedule alarms via
`SystemAlarmService`. RKSK's `minSdkVersion` is **24**, so the boot
receiver path is unreachable on every device the app supports.

Retaining the permission would let any code path (or a supply-chain
attacker via a compromised transitive dependency) register a boot
receiver that starts RKSK at power-on with no user gesture — a
persistence primitive that is completely unnecessary for a
foreground-launched health-data app.

**Regression signal:** WorkManager is a common transitive dep that
gets pulled in by dozens of libraries. If a future RN module needs
`BOOT_COMPLETED` for a legitimate reason (highly unlikely on RKSK's
minSdk range), remove the strip AND document the specific need here.

### 5.3 USE_BIOMETRIC

**Source AAR:** `react-native-keychain` — declared at
`node_modules/react-native-keychain/android/src/main/AndroidManifest.xml`
alongside `USE_FINGERPRINT`.

**Capability granted:** Allows the app to invoke `BiometricPrompt` /
Keychain access-control levels that gate cryptographic key retrieval
behind a biometric prompt.

**Why RKSK doesn't need it:** `react-native-keychain` declares the
permission unconditionally, but its API only enforces biometric access
control when the caller passes `accessControl:
Keychain.ACCESS_CONTROL.BIOMETRY_*` or one of the
`BIOMETRY_ANY_OR_DEVICE_PASSCODE` variants. RKSK's Keychain wrapper
at:

- `src/utils/security/secureToken.js` — JWT storage
- `src/utils/security/encryptionKey.js` — Redux-persist AES key

was intentionally simplified during **F-04** to a passphrase-free /
no-access-control configuration (for emulator compatibility and to
avoid a biometric prompt gate during app startup). A codebase-wide
grep for `setAccessControl`, `accessControl`, `BIOMETRY`, and
`BIOMETRIC` under `src/utils/security/` returns zero matches.

**Regression signal:** If a future edit adds biometric-gated storage
(e.g., to protect the JWT with a fingerprint prompt), delete the
strip AND file the new access pattern here. The BiometricPrompt API
on RKSK's minSdk=24 works through the AndroidX shim library which
also needs USE_BIOMETRIC; there's no way to add biometric protection
without adding the permission back.

### 5.4 USE_FINGERPRINT

**Source AAR:** `react-native-keychain` — same location as
USE_BIOMETRIC.

**Capability granted:** The pre-API-28 counterpart of `USE_BIOMETRIC`.
Used only by the legacy `FingerprintManager` API which was **deprecated
in API 28 (Android Pie)** in favour of `BiometricPrompt`.

**Why RKSK doesn't need it:** Even if biometric is reintroduced later
(§5.3), USE_FINGERPRINT should stay off. The AndroidX BiometricPrompt
shim (available on RKSK's minSdk=24) works with just USE_BIOMETRIC
and internally handles the fallback to FingerprintManager on older
devices where required.

**Regression signal:** No legitimate reason to reintroduce this
permission on RKSK's minSdk. If a diff proposes it, treat as a
signal that the biometric API is being used incorrectly.

---

## 6. Verification

### 6.1 Inspect the final merged manifest

```bash
cd android
./gradlew :app:processReleaseMainManifest
# Then grep the OUTPUT:
grep -E '<uses-permission' \
  app/build/intermediates/merged_manifest/release/*/AndroidManifest.xml \
  | sort -u
```

Expected output — 15 permissions total (the four stripped ones must
be absent):

```
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" ...maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" ...maxSdkVersion="28" />
    <uses-permission android:name="com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE" />
    <uses-permission android:name="com.rkskmp.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" />
```

### 6.2 Confirm the Gradle guard fires on regression

To smoke-test the guard (safely — will fail the build then can be
reverted):

```bash
# Temporarily flip one strip to a no-op removal
sed -i.bak 's|tools:node="remove" />|/>|' app/src/main/AndroidManifest.xml
./gradlew clean :app:processReleaseMainManifest
# Expect:  FAILURE: Merged-manifest strip regression detected ...
mv app/src/main/AndroidManifest.xml.bak app/src/main/AndroidManifest.xml
```

### 6.3 Confirm the AAB permission list

```bash
./gradlew :app:bundleRelease
unzip -p app/build/outputs/bundle/release/app-release.aab \
  base/manifest/AndroidManifest.xml \
  | xxd | head -60
# Or, for a decoded view:
bundletool dump manifest --bundle=app/build/outputs/bundle/release/app-release.aab \
  | grep uses-permission
```

The stripped permissions must be absent from the AAB's shipping
manifest.

### 6.4 Play Console pre-launch report

After uploading the AAB to Play Console (internal testing track), the
Pre-launch report's "Sensitive permissions" section should NOT list
`DOWNLOAD_WITHOUT_NOTIFICATION`, `RECEIVE_BOOT_COMPLETED`,
`USE_BIOMETRIC`, or `USE_FINGERPRINT`.

---

## 7. Non-goals

* **Removing `INTERNET`.** The app is fundamentally a client of a
  backend HTTP API; `INTERNET` is unavoidable. This does not mean the
  app should trust the network — that concern is covered by
  `usesCleartextTraffic="true"` + `networkSecurityConfig` (currently
  enabling cleartext for `*.rkskmp.com` under a separate finding) and
  by TLS pinning where relevant.
* **Removing dangerous location perms.** Field workers legitimately
  need location for ATP form geo-tagging. The finding to worry about
  is `ACCESS_BACKGROUND_LOCATION`, which RKSK does NOT declare (would
  be flagged as over-broad if it did).
* **Migrating away from `react-native-background-actions`.** The
  library correctly implements the API-34 foreground-service contract
  and its permission surface is minimal. Migrating to WorkManager
  would trade off responsiveness (WorkManager batches jobs, min
  15-minute periodic interval) for a slightly cleaner permission
  story — not worth it for the current product.

---

## 8. Change log

| Date | Change | Finding |
|------|--------|---------|
| 2026-07-15 | Added `WRITE/READ_EXTERNAL_STORAGE` `maxSdkVersion` scopes + `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` for API 33+. | F-14 |
| 2026-07-30 | Stripped `DOWNLOAD_WITHOUT_NOTIFICATION`, `RECEIVE_BOOT_COMPLETED`, `USE_BIOMETRIC`, `USE_FINGERPRINT` via manifest merger. Added release-build guard. Documented `foregroundServiceType="dataSync"` policy justification. | F-23 |

When editing this file, add a new row with the date, a one-line
summary, and the finding ID (or "MAINT" for maintenance-only
changes).
