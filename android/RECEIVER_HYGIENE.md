# Android BroadcastReceiver Hygiene (F-25)

This document is the canonical reference for how RKSK-MP handles
Android BroadcastReceiver declarations that arrive transitively from
AndroidX / third-party AARs. Its primary content is the F-25 fix:
stripping DUMP-protected diagnostic and baseline-profile receivers
that AndroidX injects as `exported="true"`.

Related findings:
* **F-19** — `<uses-library org.apache.http.legacy>` transitive strip
  (same manifest-merger pattern).
* **F-23** — over-broad transitive permissions (same manifest-merger
  pattern; see `android/PERMISSIONS.md`).
* **F-25** — WorkManager / ProfileInstaller receivers exported under
  `android.permission.DUMP` (this document).

---

## 1. Threat model

### 1.1 What a BroadcastReceiver exposure grants

A `<receiver>` in an Android manifest defines an IPC endpoint: any
process that can send an Intent matching the receiver's
`<intent-filter>` can invoke it. Three attributes together define the
exposure:

| Attribute | Effect |
|-----------|--------|
| `android:exported="true"` | Receiver is reachable from *other* processes via Intent broadcasts. `exported="false"` restricts to the same UID / same-signature. |
| `android:enabled="true"` | Receiver is currently active. `enabled="false"` disables at runtime. |
| `android:permission="…"` | Callers must hold this permission to send an Intent that the receiver will accept. |

An exported receiver protected by a permission is safe *only if that
permission is hard to obtain* by the class of attacker in the threat
model. If the protecting permission is trivially held (see §2), the
receiver is effectively wide-open.

### 1.2 Why RKSK cares

RKSK-MP is a health-worker offline-first app deployed on state-issued
Android tablets and phones. Realistic attacker profiles include:

1. **A malicious co-tenant app** that convinces the user (or IT
   admin) to install it alongside RKSK on the same device. Wants to
   probe RKSK for exploitable state, learn its workflow shape, or
   capture runtime profiles.
2. **A physical-access attacker** who briefly gets an unlocked device
   with USB debugging enabled. Wants to enumerate RKSK's state via
   ADB before the device is re-locked.
3. **An external audit tool** (MobSF, Ostorlab, NowSecure, Google
   Play pre-launch report) flagging any `exported="true"` receiver
   as attack surface. Even if the guarding permission is
   theoretically strong, the flag lowers the app's score and
   requires a written justification.

Not in the threat model:

* Zero-click network exploits (receivers are only invocable via local
  IPC).
* Nation-state actors with kernel-level access (they can bypass any
  Android permission model regardless of manifest hygiene).

---

## 2. The `android.permission.DUMP` permission

Both receivers stripped by F-25 are protected by
`android.permission.DUMP`. Android declares this permission with
protectionLevel:

```
signature|privileged|development
```

The three flags stack:

| Flag | Who gets the permission |
|------|-------------------------|
| `signature` | Apps signed with the same certificate as the framework AOSP source (impossible for third-party apps in practice). |
| `privileged` | Apps installed under `/system/priv-app/` — bundled with the ROM. |
| `development` | Apps CAN be granted the permission at runtime via `adb shell pm grant <pkg> android.permission.DUMP` on developer devices, and by the OS's own `Shell` UID at all times. |

The `development` flag is the load-bearing risk. Concretely:

* **On a stock retail device with USB debugging OFF**: only privileged
  system apps (Google Play Services, Settings, sysdumpstate) hold
  DUMP. Attack surface is low.
* **On a device with USB debugging ON** (developer settings enabled):
  the `Shell` user (`adb shell`) inherently holds DUMP, and can be
  used as an interactive attack tool. Also, any app can be granted
  DUMP via `pm grant`.
* **On a rooted device**: any app can obtain DUMP by `su -c 'pm grant
  <pkg> android.permission.DUMP'`. Attack surface is high.

For an app deployed to field devices administered by state-level IT
(the RKSK context), the middle case is realistic — some field
devices may have USB debugging turned on temporarily for support
workflows.

---

## 3. The two receivers F-25 strips

### 3.1 `androidx.work.impl.diagnostics.DiagnosticsReceiver`

**Source AAR:** `androidx.work:work-runtime:2.9.1` (transitively
pulled in by `react-native-maps` via `androidx.startup`).

**Injected declaration:**
```xml
<receiver
    android:name="androidx.work.impl.diagnostics.DiagnosticsReceiver"
    android:directBootAware="false"
    android:enabled="true"
    android:exported="true"
    android:permission="android.permission.DUMP">
    <intent-filter>
        <action android:name="androidx.work.diagnostics.REQUEST_DIAGNOSTICS" />
    </intent-filter>
</receiver>
```

**What it does when invoked:** WorkManager writes its internal
scheduler state to `logcat` under tag `WM-DiagnosticsWrkr`. The dump
includes:

* All pending `Worker` class names — this leaks the app's autolinked
  background workflow shape (`syncATPFormData`, `syncPeerEducatorFormData`,
  etc. would all be visible even after R8 obfuscation, because they
  live in the ART jobscheduler's persisted schedule DB, not
  post-R8 dex names).
* Constraint configuration (network required? battery not low?
  charging? idle?).
* Initial delays and back-off history.
* Recent Worker execution outcomes (success / retry / failure).

**Invocation vector:** `adb shell am broadcast -a
androidx.work.diagnostics.REQUEST_DIAGNOSTICS -p com.rkskmp` — one
line, no exploit chain required.

**Legitimate app use in RKSK:** ZERO. No code in `src/` broadcasts
`REQUEST_DIAGNOSTICS`. This is purely a debugging tool for the
WorkManager library authors. Removing it strictly removes attack
surface with no functional trade-off.

**Fix:** `tools:node="remove"` in `android/app/src/main/AndroidManifest.xml`.

### 3.2 `androidx.profileinstaller.ProfileInstallReceiver`

**Source AAR:** `androidx.profileinstaller:profileinstaller:1.4.1`
(transitively pulled in by AGP's baseline-profile machinery).

**Injected declaration:**
```xml
<receiver
    android:name="androidx.profileinstaller.ProfileInstallReceiver"
    android:directBootAware="false"
    android:enabled="true"
    android:exported="true"
    android:permission="android.permission.DUMP">
    <intent-filter>
        <action android:name="androidx.profileinstaller.action.INSTALL_PROFILE" />
    </intent-filter>
    <intent-filter>
        <action android:name="androidx.profileinstaller.action.SKIP_FILE" />
    </intent-filter>
    <intent-filter>
        <action android:name="androidx.profileinstaller.action.SAVE_PROFILE" />
    </intent-filter>
    <intent-filter>
        <action android:name="androidx.profileinstaller.action.BENCHMARK_OPERATION" />
    </intent-filter>
</receiver>
```

**What each action does:**

| Action | Effect | Threat |
|--------|--------|--------|
| `INSTALL_PROFILE` | Installs the merged baseline profile shipped in the APK's `assets/dexopt/baseline.prof` so ART can AOT-compile hot methods at install time. | Modest — attacker can only force the app to install an already-shipped profile it would have installed anyway. |
| `SKIP_FILE` | Marks the profile as unusable so ART won't AOT-compile hot methods. Cold-start regresses to JIT. | Modest — attacker can force cold-start slowdown but cannot exfiltrate anything. |
| `SAVE_PROFILE` | Dumps the current runtime-captured hot-method profile to disk (`files/profileinstaller/curprof.prof.bin`). | **Higher** — this is a call-graph fingerprint of the current session, encoding which classes and methods are hot. An attacker with subsequent disk read (via a second bug) gets a runtime execution profile. |
| `BENCHMARK_OPERATION` | Trigger for macrobenchmark test harnesses. Used only during profiling CI. | Modest — used to time app internals; requires specific benchmark scaffolding to be interesting. |

**Invocation vector:** identical to DiagnosticsReceiver — `adb shell
am broadcast -a androidx.profileinstaller.action.SAVE_PROFILE -p
com.rkskmp`.

**Legitimate app use in RKSK:** ZERO. No code in `src/` invokes
ProfileInstaller. The receiver was pulled in transitively because
AGP's baseline-profile machinery is always active on release
builds. Also, RKSK ships **no user-authored baseline profile** —
`android/app/src/main/baseline-prof.txt` does not exist. The
merged baseline profile contains only minor transitive contributions
from AndroidX libraries; discarding those loses a negligible cold-
start optimization for an app whose UX pattern is hours-long
sessions after cold start.

**Fix:** `tools:node="remove"` in `android/app/src/main/AndroidManifest.xml`.

---

## 4. Why strip rather than downgrade to `exported="false"`

Both receivers are triggered ONLY by out-of-process callers — no
RKSK code path invokes either. Setting `exported="false"` would make
them invocable only from same-UID / same-signature code, which for
RKSK is exactly zero call sites. Net functional effect: identical to
full removal.

`tools:node="remove"` is preferred because:

1. **Static-analysis surface reduction.** MobSF, Ostorlab, and Play
   Console pre-launch report each traverse the merged manifest and
   flag every `<receiver>` block regardless of `exported` value.
   Removing the block entirely eliminates the finding at source.
2. **Runtime surface reduction.** An attacker with a manifest parser
   (dumped from the APK) sees no receiver — one less thing to
   probe for.
3. **Clear intent signalling.** A future maintainer reading the
   manifest sees "we deliberately removed this receiver" rather than
   "this receiver is here but disabled" (which invites the question:
   why not just delete it?).

---

## 5. If the receiver is ever needed back

### 5.1 If baseline profiles start providing measurable cold-start wins

If the product team ships a hand-authored baseline profile (via
`androidx.benchmark:benchmark-macro-junit4` MacrobenchmarkRule with
`BaselineProfileRule`, or via AGP's `generateBaselineProfile` task)
AND measurement shows the cold-start improvement is worth the
receiver's DUMP-protected attack surface:

1. Delete the `<receiver android:name="androidx.profileinstaller.
   ProfileInstallReceiver" tools:node="remove" />` block from
   `android/app/src/main/AndroidManifest.xml`.
2. Delete the corresponding entry from `mergedManifestStripRegistry`
   in `android/app/build.gradle`.
3. Update this document's §3.2 with the new rationale, including
   the measured cold-start improvement number.
4. Update `android/PERMISSIONS.md` change log with the reintroduction.
5. Consider whether the receiver can be constrained further — e.g.
   removing the specific `SAVE_PROFILE` and `BENCHMARK_OPERATION`
   intent-filter children (which are dev-only) while keeping
   `INSTALL_PROFILE` and `SKIP_FILE` (which Play Store needs). The
   manifest merger supports this via a partial replace strategy;
   see the AGP docs on `tools:node="mergeOnlyAttributes"`.

### 5.2 If a legitimate need for WorkManager diagnostics emerges

Practically zero chance for a production app. If a developer needs
WorkManager state for debugging, use the in-process
`WorkManager.getInstance().getWorkInfosLiveData(...)` API instead —
no exported receiver required, and the data is scoped to the app's
own UID.

---

## 6. Verification

### 6.1 Confirm the receivers are absent from the merged release manifest

```bash
cd /Users/Geeta/Desktop/NHM/rksk
./gradlew :app:processReleaseMainManifest
grep -E 'DiagnosticsReceiver|ProfileInstallReceiver' \
  android/app/build/intermediates/merged_manifest/release/*/AndroidManifest.xml
# Expected output: (empty)
```

### 6.2 Confirm the Gradle guard fires on regression

```bash
# Temporarily comment out ONE of the tools:node="remove" lines, then:
./gradlew clean :app:processReleaseMainManifest
# Expected: FAILURE with the exact needle that reappeared, and a
# pointer to android/RECEIVER_HYGIENE.md §<receiver>.
```

### 6.3 Confirm ADB can no longer trigger the receivers on a device

After installing a debug APK built from the fixed source:

```bash
adb shell am broadcast -a androidx.work.diagnostics.REQUEST_DIAGNOSTICS \
  -p com.rkskmp
# Expected:
# Broadcasting: Intent { act=androidx.work.diagnostics.REQUEST_DIAGNOSTICS ... }
# Broadcast completed: result=0
# (result=0 means "no receiver matched" — the receiver is gone from
# the merged manifest.)
```

```bash
adb shell am broadcast -a androidx.profileinstaller.action.SAVE_PROFILE \
  -p com.rkskmp
# Same expected result.
```

### 6.4 Play Console pre-launch report

After uploading a release build to an internal testing track, the
pre-launch report's "Exposed components" section should NOT list
`DiagnosticsReceiver` or `ProfileInstallReceiver`.

---

## 7. Non-goals

* **Removing `androidx.work:work-runtime` or `androidx.profileinstaller`
  entirely.** Both are pulled in transitively by dependencies we
  legitimately need (`react-native-maps` and AGP baseline-profile
  tooling respectively). The manifest-merger strip is the surgical
  fix; removing the AARs would require replacing their transitive
  consumers, which is out of scope for F-25.

* **Auditing every AndroidX receiver.** F-25 addresses the two
  receivers the security assessment flagged. If future audits
  identify additional exported receivers with permissive protection,
  extend `mergedManifestStripRegistry` and this document
  symmetrically.

* **Runtime attestation that receivers were actually stripped.** The
  Gradle guard is a build-time check. If a supply-chain attacker
  ships an AAR with a receiver that our merger doesn't cover, the
  runtime app would still expose it. Mitigating that class of
  attack is the domain of F-13 (integrity) and F-10 (SBOM /
  supply-chain), not F-25.

---

## 8. Change log

| Date | Change | Finding |
|------|--------|---------|
| 2026-07-31 | Introduced `tools:node="remove"` for `DiagnosticsReceiver` + `ProfileInstallReceiver`. Extended `mergedManifestStripRegistry` guard. Authored this document. | F-25 |

When editing this file, add a new row with the date, a one-line
summary, and the finding ID (or "MAINT" for maintenance-only
changes).
