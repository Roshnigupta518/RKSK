# F-22 — Cloud backup + Device-to-Device transfer opt-out

Status: **fixed** (`data_extraction_rules.xml` + `AndroidManifest` attributes + release-build Gradle guard)
Owner: Frontend/Android security workstream
Related findings: F-04 (Keychain / redux-persist encryption — determines what would leak if this opt-out ever regresses), F-14 (external-storage permission scoping)

---

## 1. What was flagged

The L1 audit observed that RKSK's `AndroidManifest.xml` declared
`android:allowBackup="false"` but did **not** declare
`android:dataExtractionRules`. On Android 12 (API 31) and above, that
combination leaves the "Copy from old phone" device-to-device (D2D)
restore path fully open, copying every app-private file and shared
preference to the target device during setup.

## 2. Why `allowBackup="false"` alone is insufficient

Android exposes two independent "copy my app data" channels:

| Channel                             | Introduced | Gated by (API ≤ 30)  | Gated by (API ≥ 31)                                |
| :---------------------------------- | :--------- | :------------------- | :------------------------------------------------- |
| Cloud (Google One / Drive)          | Android 6  | `android:allowBackup` | `android:allowBackup` **and** `dataExtractionRules` |
| Device-to-device transfer ("Copy from old phone") | Android 12 | (n/a — didn't exist) | `android:dataExtractionRules` **only**              |

The critical row is the second one. On API 31+, `allowBackup="false"`
still stops CLOUD backup — but the D2D setup-wizard flow is governed
entirely by `dataExtractionRules`. Without an explicit
`<device-transfer>` opt-out, the OS copies the entire app-private
storage tree to the target device.

Google's own guidance confirms this
(<https://developer.android.com/about/versions/12/backup-restore>):

> On devices running Android 12 (API level 31) and higher, the
> `android:allowBackup` attribute has no effect on device-to-device
> transfers.

## 3. What ships in the app now

### 3.1 The rules file

`android/app/src/main/res/xml/data_extraction_rules.xml`:

```xml
<data-extraction-rules>
    <cloud-backup disableIfNoEncryptionCapabilities="true">
        <exclude domain="root" />
        <exclude domain="external" />
        <exclude domain="device_root" />
    </cloud-backup>

    <device-transfer>
        <exclude domain="root" />
        <exclude domain="external" />
        <exclude domain="device_root" />
    </device-transfer>
</data-extraction-rules>
```

Each `<exclude>` disables the channel for a filesystem domain:

| Domain        | Covers                                                            |
| :------------ | :---------------------------------------------------------------- |
| `root`        | `/data/data/com.rkskmp/` — `files/`, `databases/`, `shared_prefs/` |
| `external`    | `/sdcard/Android/data/com.rkskmp/files/` — app-scoped external    |
| `device_root` | Device Protected Storage (Direct Boot). RKSK doesn't use it today, but the exclude is future-proofing. |

`disableIfNoEncryptionCapabilities="true"` on `<cloud-backup>` is
Google's belt-and-braces flag — if the device or account can't
participate in E2E encrypted backups, no cloud backup runs regardless
of the other rules.

### 3.2 The manifest wiring

`android/app/src/main/AndroidManifest.xml` `<application>` element
declares **both** attributes:

```xml
<application
    android:allowBackup="false"
    android:dataExtractionRules="@xml/data_extraction_rules"
    ...
```

- `allowBackup="false"` handles API 24-30 (which silently ignore the
  `dataExtractionRules` attribute they don't know about).
- `dataExtractionRules="@xml/data_extraction_rules"` handles API 31+
  for BOTH cloud AND device-transfer.

Both are required. Removing either regresses coverage for a real
Android API range.

### 3.3 Release-build Gradle guard

`android/app/build.gradle` runs a source-file assertion inside the
existing `gradle.taskGraph.whenReady` release hook (alongside the
F-07 keystore check and F-08 Maps-key check). The guard fires only
for release builds and validates:

1. `AndroidManifest.xml` still contains the exact string
   `android:dataExtractionRules="@xml/data_extraction_rules"`.
2. `AndroidManifest.xml` still contains `android:allowBackup="false"`.
3. `data_extraction_rules.xml` still contains BOTH `<cloud-backup>`
   and `<device-transfer>` blocks.
4. Each block still carries `<exclude domain="root"` and
   `<exclude domain="external"` matches.
5. No `<include>` rule reopens `root`, `external`, or `device_root`
   for either channel.

If any assertion fails, the release build stops with a diagnostic
that points here.

The guard is intentionally string-level: these attributes cannot be
injected by a dependency (manifest merger requires app-module-authored
values), and the source file lives in git with the F-22 header
comment as the human-readable regression breadcrumb.

## 4. Threat model — what actually leaks without this fix

RKSK's local state is layered:

| Location                                              | Encrypted at rest?                     | Leaks on D2D restore?              |
| :---------------------------------------------------- | :------------------------------------- | :--------------------------------- |
| Keychain (JWT after F-04)                             | Yes — Android Keystore, hardware-bound | No (Keystore keys don't transfer)  |
| `databases/RKStorage.db` (redux-persist)              | Yes — AES via `redux-persist-transform-encrypt`, key in Keychain | Ciphertext transfers, key does not; effectively undecryptable on target |
| `shared_prefs/*.xml` (RN modules, third-party libs)   | No                                     | **Yes — plaintext**                |
| `files/*` — react-native-fs downloads, offline drafts | No                                     | **Yes — plaintext**                |
| `cache/*` — image-picker temp, compressMedia outputs  | No                                     | **Yes — plaintext**                |
| External app-scoped `Android/data/com.rkskmp/files/*` | No                                     | **Yes — plaintext**                |

The "Yes — plaintext" rows are the ones F-22 closes. Without the
fix, a user restoring "old phone" onto an attacker-controlled new
phone (a lost / stolen device scenario, or a hostile lab setup)
would ship all of those files verbatim.

The Keychain / redux-persist rows are protected by the F-04
encryption boundary regardless of F-22, so those are safe either way
— but the plaintext files above them are not.

## 5. Verification

### 5.1 Static (source-level, no rebuild needed)

```bash
# Manifest wiring:
grep -n 'dataExtractionRules\|allowBackup' android/app/src/main/AndroidManifest.xml
# Expected: both attributes present on <application>.

# Rule content:
xmllint --noout android/app/src/main/res/xml/data_extraction_rules.xml && echo "well-formed"
grep -c '<exclude domain="root"'     android/app/src/main/res/xml/data_extraction_rules.xml
grep -c '<exclude domain="external"' android/app/src/main/res/xml/data_extraction_rules.xml
# Expected: 2 each (one under <cloud-backup>, one under <device-transfer>).
```

### 5.2 Build-time (Gradle guard fires)

```bash
cd android
./gradlew assembleRelease           # or bundleRelease
# The F-22 guard runs during gradle.taskGraph.whenReady for release
# builds. If the manifest or the rules file is broken, the build
# fails with an "F-22: ..." exception pointing back here.
```

To positive-test the guard: temporarily comment out the
`android:dataExtractionRules` attribute in `AndroidManifest.xml` and
re-run `./gradlew assembleRelease` — build should fail with:

```
F-22: android:dataExtractionRules="@xml/data_extraction_rules" is missing
```

Then restore the attribute and rerun.

### 5.3 Runtime (real device / emulator)

The most reliable check is to trigger a fake restore and observe
that the app declines. Requires two devices (or two AVDs) and takes
about 15 minutes.

```bash
# On the SOURCE device: install a release build, sign in, generate
# some local state (download a form, capture a photo, etc.).
adb -s <source> install app-release.apk
# ... use the app briefly ...

# Trigger a Backup Manager run and confirm the "package excluded"
# message appears in logcat.
adb -s <source> shell bmgr enable true
adb -s <source> shell bmgr backupnow com.rkskmp
adb -s <source> logcat -d | grep -Ei 'com.rkskmp.*backup|backup.*com.rkskmp' | head -20
# Expected: no successful backup entries. The Backup Manager should
# either skip the package outright or log "no data to back up".

# On the TARGET device: install the same APK, but before signing
# in, use `bmgr restore` (or the OS setup-wizard D2D flow) and
# observe that no app-private storage is populated for our package.
adb -s <target> shell run-as com.rkskmp ls -la files/ databases/ shared_prefs/
# Expected: empty or default (only what a fresh install would create).
```

Note: `bmgr` uses the Backup Manager Transport, which honours
`<cloud-backup>` rules but not the setup-wizard D2D path directly.
The strongest smoke test for D2D is a real setup-wizard on a physical
device — factory-reset the target device, walk through the setup
wizard, tap "Copy from old phone", complete the copy, then verify
`run-as com.rkskmp ls files/` returns an empty tree on the target.

### 5.4 APK-level inspection

```bash
apkanalyzer manifest print app-release.apk | grep -E 'allowBackup|dataExtractionRules'
# Expected: both attributes present with the F-22 values.

# Confirm the XML resource is packaged.
unzip -l app-release.apk | grep 'data_extraction_rules'
# Expected: one entry at res/xml/data_extraction_rules.xml.
```

## 6. Non-goals / what this fix does NOT do

- It does **not** block explicit user-initiated exports. If the user
  taps "Share" or "Export" on a captured artifact and picks an
  external destination, that goes through the app's own share
  intent, not the backup / D2D path.
- It does **not** encrypt data at rest that isn't already encrypted.
  Files under `files/`, `cache/`, and external app-scoped storage
  remain plaintext on disk — they're just not exfiltrated via the
  backup / D2D channel any more. Encrypting file contents at rest is
  a separate finding (out of scope for F-22).
- It does **not** guard against attackers with physical access to a
  rooted device. Root breaks the app-private sandbox entirely and
  makes any at-rest data readable regardless of manifest rules. See
  F-13 (root / integrity detection) for the counterpart mitigation.
- It does **not** replace `android:allowBackup="false"`. Both are
  required for full-API-range coverage; the Gradle guard fails the
  build if either goes missing.

## 7. Trade-offs

The user experience cost of a total opt-out is that a user who
switches phones cannot restore their local RKSK state to the new
device — they must sign in again through SSO/OTP and let the app
rehydrate from the backend. For a health-worker data-collection app
where every session is server-authoritative, this is the correct
trade-off: local state is never the source of truth, so losing it in
a device switch is expected and safe.

If a future product decision reverses this — e.g. a genuinely
offline-first workflow that keeps critical local state a
first-class artifact — then the mitigation is to encrypt everything
at rest with a user-derived KDF (passphrase / biometric-wrapped
Keystore key that can be re-derived on the new device) BEFORE
selectively re-enabling backup for the encrypted files. Do NOT
simply flip an `<exclude>` to `<include>` — that would just
reintroduce the F-22 exposure. Extend this document with the new
threat model first.

## 8. Change log

- **2026-07-30** — F-22 fix committed. `data_extraction_rules.xml`
  authored, manifest attributes wired, release-build Gradle guard
  added, this document created.
