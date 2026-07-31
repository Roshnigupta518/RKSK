# WebView Remote-Debugging Hardening (F-26)

> Audit finding **F-26** — *"WebView Remote-Debugging Prop Wired but Not
> Statically Confirmed Enabled"*.
>
> Owner: platform-security. Reviewers: mobile-eng.

## 1. TL;DR

RKSK ships `react-native-webview 13.16.1` (transitively via
`react-native-youtube-iframe` for the in-app YouTube video screen).
Android's `WebView.setWebContentsDebuggingEnabled(boolean)` is a **static,
process-wide** switch — one invocation with `true` gives anyone with USB
access a full `chrome://inspect` attachment on **every** WebView in the
process for the rest of the process lifetime: DOM, JavaScript console,
network, cookies, `localStorage`, `sessionStorage`.

The pristine `react-native-webview` code wires two paths to that switch,
neither of which is statically provable to be off in a release APK. F-26
closes the gap with a four-layer defence:

| Layer | Where | What it does |
|---|---|---|
| 1 | `patches/react-native-webview+13.16.1.patch` on `RNCWebViewManagerImpl.kt` | Adds a second compile-time gate (library's own `BuildConfig.DEBUG`) to the instantiation-time enable, and turns the JS-controllable `webviewDebuggingEnabled` prop into a no-op in release builds. |
| 2 | `MainApplication.onCreate()` | Explicitly calls `WebView.setWebContentsDebuggingEnabled(false)` at process start on release builds, **before** the RN JS context loads. |
| 3 | `scripts/security-denylist.js` (postinstall) | Fails `npm install` / CI if the patch didn't apply cleanly — checks both pristine-leftover and patched-in markers. |
| 4 | `android/WEBVIEW_DEBUGGING.md` (this file) | Threat model, verification, regeneration playbook. |

**Debug builds are unaffected.** Developers still get `chrome://inspect`
against dev builds; the hardening only fires when the app is compiled as
`release`.

## 2. Threat model

### 2.1 What "remote debugging" gives an attacker

Once `WebView.setWebContentsDebuggingEnabled(true)` has been called
anywhere in a process, plugging the device into a workstation and opening
`chrome://inspect` in Chrome/Chromium/Edge exposes every WebView in that
process, including WebViews that never explicitly opted in. The attacker
can:

- Enumerate every DOM node and read the rendered content.
- Execute arbitrary JavaScript in the WebView's context (`document.cookie`
  reads and writes; `localStorage` and `sessionStorage` full R/W;
  arbitrary `fetch()` with the WebView's cookie jar).
- Set breakpoints on the WebView's JavaScript and inspect the runtime
  state of any framework running inside it.
- Observe every subresource fetched by the WebView (`Network` tab).
- Read the WebView's `IndexedDB`, service-worker cache, and (on Android
  system WebView ≥ 88) any `origin trials` metadata.

### 2.2 Why RKSK specifically cares

RKSK is not a WebView-first app — none of the JS code in `src/` renders a
`<WebView>` directly. But `react-native-youtube-iframe` (used in
`src/screens/dashboard/ViewVdo/index.js` for training-content video
playback) instantiates a WebView under the hood, so an authenticated
user session includes at least one live WebView. Both the login JWT and
the redux-persist-encrypted PII slices (F-04) live in the same process
as that WebView. A `chrome://inspect` attach against a RKSK release
build would be a full-session hijack primitive on any device where USB
debugging is enabled — no exploit required, just a data cable.

Field devices used by ANM / ASHA workers frequently run with developer
options on (needed for AJT/ADB pushes of test builds), which makes the
"attacker has a USB cable" threat model realistic rather than theoretical.

### 2.3 What the audit tool actually flagged

The audit's phrase was *"prop wired but not statically confirmed
enabled"*. Reverse-engineered from the DEX, the auditor sees:

1. **`RNCWebViewManagerImpl.createViewInstance()`** (line 91 in the
   pristine file) contains:

   ```kotlin
   if (ReactBuildConfig.DEBUG) {
       WebView.setWebContentsDebuggingEnabled(true)
   }
   ```

   `ReactBuildConfig.DEBUG` is `com.facebook.react.common.build.ReactBuildConfig.DEBUG`,
   which is a compile-time constant baked into the **prebuilt
   `react-android` AAR** picked up at link time. It is *not* the app's
   own `BuildConfig.DEBUG`. Static analysis of the RKSK APK can see the
   `if` but cannot cheaply prove which AAR variant was actually linked,
   and any misconfiguration in the `com.facebook.react` Gradle plugin
   (custom `variantFilter`, manual dependency override) can flip
   `ReactBuildConfig.DEBUG` to `true` in a release build.

2. **`RNCWebViewManagerImpl.setWebviewDebuggingEnabled()`** (line 714)
   contains:

   ```kotlin
   fun setWebviewDebuggingEnabled(viewWrapper: RNCWebViewWrapper, enabled: Boolean) {
       RNCWebView.setWebContentsDebuggingEnabled(enabled)
   }
   ```

   This is the setter for the React prop `webviewDebuggingEnabled`. It
   is completely ungated — any JS code that renders
   `<WebView webviewDebuggingEnabled={true} />` will flip the
   process-wide flag at runtime, regardless of build type. Because the
   flag is process-wide, the request need not come from RKSK code — a
   compromised dependency (supply-chain attack) can smuggle the prop in.

The audit can't statically prove either path is disabled, so it flags
both.

## 3. The four-layer fix

### 3.1 Layer 1 — Patch `RNCWebViewManagerImpl.kt` (compile-time)

`patches/react-native-webview+13.16.1.patch` (auto-applied by
`patch-package` at postinstall) makes three edits to
`RNCWebViewManagerImpl.kt`:

```kotlin
// Added import (top of file)
import com.reactnativecommunity.webview.BuildConfig

// createViewInstance() — was:
// if (ReactBuildConfig.DEBUG) {
if (ReactBuildConfig.DEBUG && BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}

// setWebviewDebuggingEnabled() — was: (unconditional)
fun setWebviewDebuggingEnabled(viewWrapper: RNCWebViewWrapper, enabled: Boolean) {
    if (!BuildConfig.DEBUG) {
        return
    }
    RNCWebView.setWebContentsDebuggingEnabled(enabled)
}
```

Why `com.reactnativecommunity.webview.BuildConfig` and not
`ReactBuildConfig`?

- `react-native-webview` is a **source-form** Android library
  (`apply plugin: 'com.android.library'` in its `build.gradle`, plus
  `buildFeatures { buildConfig true }`).
- Android Gradle Plugin generates a `BuildConfig` class per library
  module whose `DEBUG` field reflects the **consuming app's** build
  variant. So when RKSK is built as `release`, `react-native-webview` is
  also compiled `release`, and `com.reactnativecommunity.webview.BuildConfig.DEBUG`
  is `false`.
- `ReactBuildConfig.DEBUG` in contrast lives in the prebuilt
  `react-android` AAR (`com.facebook.react.BuildConfig`), and its value
  is fixed at the time Facebook / RN maintainers built that AAR. AGP
  auto-selects between `react-android` and `react-android-debug`
  based on the consuming variant, but that selection depends on the
  `com.facebook.react` Gradle plugin being wired up correctly. Requiring
  BOTH gates gives us a static guarantee that survives a misconfigured
  AAR variant selection.

### 3.2 Layer 2 — `MainApplication.onCreate()` force-disable (runtime)

```kotlin
override fun onCreate() {
    super.onCreate()
    if (!BuildConfig.DEBUG) {
        WebView.setWebContentsDebuggingEnabled(false)
    }
    loadReactNative(this)
}
```

`Application.onCreate()` is the very first user code the OS invokes on
process start — before `loadReactNative()`, before any React module
initialisation, before any WebView is materialised. Calling
`setWebContentsDebuggingEnabled(false)` here guarantees the process
starts in the disabled state.

Layer 2 alone would not be sufficient — Layer 1 is what prevents a
later `setWebContentsDebuggingEnabled(true)` from being called. But
Layer 2 provides defence-in-depth: if some future dependency (not
under our patch) starts calling `setWebContentsDebuggingEnabled(true)`
during `PackageList` construction, our earlier reset happened *before*
that call, and Layer 1 blocks that call itself.

### 3.3 Layer 3 — `scripts/security-denylist.js` regression guard

The `postinstall` chain is:

```json
"postinstall": "patch-package --error-on-fail && node scripts/security-denylist.js"
```

`patch-package --error-on-fail` fails the install if any `.patch` file
can't be applied. But that catches only the *file-context mismatch*
failure mode — it doesn't catch "patch applied, but to a location that
no longer means what we thought". For F-26 we care about the latter,
because a WebView-package refactor could theoretically produce a file
where the patch applies cleanly but leaves the vulnerable code paths
intact.

`security-denylist.js` grep-checks the post-patch file for:

- **Forbidden markers** (pristine leftovers): if the exact string
  `if (ReactBuildConfig.DEBUG) {` still appears in the file, the
  instantiation-time gate is NOT hardened.
- **Required markers** (patched-in): the F-26 import, the compound
  gate, the release-build short-circuit inside
  `setWebviewDebuggingEnabled`, and the `F-26 hardening` comment banner.
  If any of these is missing, the patch did not apply where we expected.

Both failure modes emit a red banner and exit non-zero, blocking the
install / CI job.

### 3.4 Layer 4 — this document

If you're bumping `react-native-webview`, changing the WebView code,
or investigating a WebView-adjacent security finding, start here. See
§5 (verification) and §6 (regeneration playbook).

## 4. Why not just remove `react-native-webview`?

We considered a five-layer defence that included denylisting
`react-native-webview` outright (à la F-12 for `react-native-send-intent`)
and using a WebView-free alternative for the YouTube screen. Reasons we
did not:

1. **No drop-in replacement.** `react-native-youtube-iframe` is the
   dominant option for embedded YouTube in RN and it hard-depends on a
   WebView. Rolling our own would require either the `youtube.com/embed`
   URL loaded in a raw `android.webkit.WebView` (same underlying risk),
   or an ExoPlayer-backed native module (out-of-scope for F-26,
   trackable as a separate roadmap item).
2. **Removing the top-level dep would break YouTube.** The training
   videos are a critical user-facing surface for ASHA/ANM upskilling.
3. **Hardening + guarding covers the finding.** The audit asks for
   static confirmation of the disabled state; four layers give that,
   independently verifiable via §5.

If ExoPlayer replaces YouTube embed in a future release, revisit and
denylist `react-native-webview`.

## 5. Verification

### 5.1 Confirm the patch is applied

```bash
grep -c 'if (ReactBuildConfig.DEBUG && BuildConfig.DEBUG)' \
  node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt
# expect: 1

grep -c '^import com.reactnativecommunity.webview.BuildConfig$' \
  node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt
# expect: 1

grep -c 'if (!BuildConfig.DEBUG) {' \
  node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt
# expect: 1
```

### 5.2 Confirm the postinstall guard is green

```bash
node scripts/security-denylist.js && echo "OK"
```

Expected: `OK` printed, exit 0, no red banner.

### 5.3 Confirm `MainApplication.onCreate()` calls the force-disable

```bash
grep -n 'setWebContentsDebuggingEnabled' \
  android/app/src/main/java/com/rksk/MainApplication.kt
# expect: one match, WITHIN a `!BuildConfig.DEBUG` block
```

### 5.4 Runtime verification on a release build

1. Build and install a release APK:

   ```bash
   cd android && ./gradlew clean assembleRelease
   adb install app/build/outputs/apk/release/app-arm64-v8a-release.apk
   ```

2. Launch the app and navigate to the YouTube training video screen so
   a `WebView` is instantiated.
3. On the workstation, open `chrome://inspect#devices` in Chrome.
4. **Expected:** the RKSK process appears under "Devices" but has
   **zero inspectable pages / WebViews** listed. The `inspect` link is
   not offered for any RKSK-owned WebView.
5. **Contrast:** repeat with a debug build (`./gradlew installDebug`).
   The same screen should now show the WebView and offer `inspect`.

### 5.5 APK-level static verification (optional, for release audits)

Post-build, decompile the release APK and confirm:

```bash
# Extract the DEX
apkanalyzer dex code \
  --class 'com.reactnativecommunity.webview.RNCWebViewManagerImpl' \
  android/app/build/outputs/apk/release/app-*-release.apk \
  | grep -E 'BuildConfig|setWebContentsDebuggingEnabled'
```

You should see the compound-gate check bytecode referencing BOTH
`com/reactnativecommunity/webview/BuildConfig.DEBUG` and
`com/facebook/react/common/build/ReactBuildConfig.DEBUG`. In release
mode R8 will typically constant-fold the compound expression to `false`
and dead-code-eliminate the `WebView.setWebContentsDebuggingEnabled(true)`
call site entirely — that's ideal, and the APK will not contain a
reachable path to `setWebContentsDebuggingEnabled(true)` at all.

## 6. Regeneration playbook (react-native-webview version bumps)

When Dependabot / a manual bump moves `react-native-webview` to a new
version, the patch may no longer apply cleanly. Recovery:

1. `npm install <new-version>` — allow `patch-package --error-on-fail`
   to fail loud if the hunks reject.

2. Inspect the new upstream `RNCWebViewManagerImpl.kt`:

   ```bash
   npm pack react-native-webview@<new-version>
   tar -xzf react-native-webview-<new-version>.tgz
   less package/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt
   ```

   Locate the two anchor points:
   - `if (ReactBuildConfig.DEBUG) { WebView.setWebContentsDebuggingEnabled(true) }` (or equivalent)
   - `fun setWebviewDebuggingEnabled(... , enabled: Boolean) { ... }` (or equivalent)

3. If both still exist with the same intent, re-apply the F-26 edits
   manually to `node_modules/react-native-webview/.../RNCWebViewManagerImpl.kt`
   using the exact same three edits documented in §3.1.

4. Regenerate the patch:

   ```bash
   npx patch-package react-native-webview
   ```

   Verify `patches/react-native-webview+<new-version>.patch` was
   written and matches the shape of the previous patch.

5. Delete the old versioned patch file (`patches/react-native-webview+13.16.1.patch`)
   only after the new one is in place — do not lose the historical
   record until the replacement is confirmed working.

6. Run the guard:

   ```bash
   node scripts/security-denylist.js && echo OK
   ```

7. If upstream **renamed or restructured** the vulnerable methods,
   update:
   - `patches/react-native-webview+<new-version>.patch`
   - `scripts/security-denylist.js` STRIPPED_TRANSITIVE_DEPS entry
     for F-26 (both `forbiddenSymbols` and `requiredSymbols`)
   - This document (§3.1 code snippets, §5.1 grep commands)

## 7. Non-goals / follow-ups

- **Not fixed here:** third-party WebView-based ads / analytics SDKs
  we might integrate later. Any such addition needs its own F-26-style
  audit — see the checklist in `android/NATIVE_MODULES.md` for the
  process.
- **Not fixed here:** the `debuggable="true"` attribute on the
  application element — that's a completely different debug surface
  (JDWP attach to the whole app). RKSK never sets it in `release`;
  it's only wired in via AGP's automatic debug-variant manifest merge.
- **Follow-up:** consider replacing `react-native-youtube-iframe` with
  an ExoPlayer-backed native module in a future roadmap slot. That
  would let us denylist `react-native-webview` altogether and drop
  Layers 1–3 for this finding.

## 8. Change log

| Date | Layer | Change |
|---|---|---|
| 2026-07-31 | 1 | Initial patch shipped in `patches/react-native-webview+13.16.1.patch`. |
| 2026-07-31 | 2 | `MainApplication.onCreate()` force-disable added. |
| 2026-07-31 | 3 | `scripts/security-denylist.js` extended with F-26 entry and `requiredSymbols` schema. |
| 2026-07-31 | 4 | This document created. |

## 9. Related findings

- **F-04** (JWT + PII in AsyncStorage) — WebView remote-debugging is the
  primary exfil channel for the secrets F-04 protects. Both fixes are
  mutually reinforcing.
- **F-12** (`react-native-send-intent` denylist) — same
  patch-package + postinstall-guard pattern, applied to a package
  we could safely remove; here we couldn't so we hardened instead.
- **F-18** (LAME / JLayer excision inside `react-native-compressor`) —
  the direct predecessor of this fix's Layer 3 mechanism.
