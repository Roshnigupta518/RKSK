# Obfuscation & bytecode hardening (F-15)

> **Audit finding F-15** — Hermes bytecode ships unobfuscated. String
> literals (URLs, endpoint paths, business terms), function / class /
> method names, and JSDoc/comments are all recoverable from the shipped
> `index.android.bundle`. On the native side, `classes.dex` exposed every
> Java/Kotlin class name because R8 was disabled
> (`enableProguardInReleaseBuilds = false`).

This document is the source of truth for how RKSK obfuscates its release
artifacts and how to verify the obfuscation actually took effect.

---

## 1. What Hermes bytecode DOES and DOES NOT hide

Hermes compiles the Metro-output JavaScript to a proprietary bytecode
(`.hbc`) that is embedded in `index.android.bundle`. That transform:

| Hides | Preserves |
| --- | --- |
| Whitespace, formatting, comments (post-Terser) | **All string literals** — URLs, error messages, log strings, translation keys, business terms |
| Local variable names inside functions | **Function names** — kept in the HBC symbol table for stack traces |
| Unreachable / dead code (after Metro DCE) | **Class names** — kept so `Component.displayName` / ErrorBoundary display sensibly |
| Human-readable JS syntax | **Property names** — every `obj.someMethod` reads back as `someMethod` in the string table |

That is why "Hermes = obfuscated" is a common misconception. Tools like
[`hermes-dec`](https://github.com/P1sec/hermes-dec) and `hbctool` reliably
decompile HBC back to pseudo-JavaScript that a competent reverse engineer
can read.

**F-15's job is therefore to shrink what those tools can recover, not to
promise 0% recovery.** No client-side obfuscation defeats a determined
attacker with the running APK in hand — treat obfuscation as a friction
layer, and rely on server-side authorization + rate-limiting + certificate
pinning + Play Integrity attestation for the actual security boundary.

---

## 2. What F-15 changed

### 2.1 Metro / JS bundle (`metro.config.js`)

Aggressive-but-Hermes-safe minifier options:

| Setting | Value | Effect |
| --- | --- | --- |
| `compress.drop_console` | `true` | Terser deletes every `console.*` call site (defense-in-depth over F-05's Babel plugin) |
| `compress.drop_debugger` | `true` | Terser strips every `debugger;` statement |
| `compress.passes` | `2` | Second pass sweeps newly-dead code created by pass 1 |
| `compress.reduce_funcs` | `false` | **Must stay off** — Hermes+Terser inlining has hit known crashes |
| `output.comments` | `'some'` | Casual comments (JSDoc, `// TODO`, inline hints) stripped; comments matching `/^!/` or containing `@license` / `@preserve` retained (MIT / BSD / Apache-2.0 attribution compliance) |
| `output.ascii_only` | `true` | 7-bit-clean bundle, no UTF-8 surrogates |
| `mangle.toplevel` | `false` | **Must stay off** — Metro emits `__d/__r` module runtime at top level |
| `keep_classnames` / `keep_fnames` | `true` | Retained so `ErrorBoundary`, React DevTools symbolication, and library `.name` reads work |

Reserved-word list (`__d`, `__r`, `__c`, `__G`, `require`, `__DEV__`,
`__PLATFORM__`) protects the Metro / Hermes module runtime from
accidental renaming.

### 2.2 Android / native (`android/app/build.gradle`)

```groovy
def enableProguardInReleaseBuilds = true   // was false

release {
    minifyEnabled enableProguardInReleaseBuilds
    shrinkResources enableProguardInReleaseBuilds
    proguardFiles getDefaultProguardFile("proguard-android.txt"),
                  "proguard-rules.pro"
}
```

- `minifyEnabled` → invokes R8 (successor of ProGuard baked into AGP).
  R8 does DCE + name obfuscation + tree-shaking + constant folding on the
  compiled Java/Kotlin classes → shipped `classes.dex` no longer contains
  human-readable class names.
- `shrinkResources` → drops any drawable / layout / string that R8 proved
  is unreachable. Removes dead assets and shrinks the APK.

Debug builds intentionally skip R8 — a 30-second R8 pass on every
`assembleDebug` would kill the fast-refresh loop.

### 2.3 ProGuard rules (`android/app/proguard-rules.pro`)

App-level rules were empty (only a template stub). File is now populated
with:

1. Attribute preservation (annotations, source-file rename, exceptions,
   `LineNumberTable` for symbolicable stack traces).
2. Kotlin runtime keeps (`kotlin.Metadata`) — needed because
   `MainActivity.kt` / `MainApplication.kt` are Kotlin.
3. Application entry-point keeps — `MainActivity`, `MainApplication`,
   `BuildConfig`, and every `extends Application/Activity/Service/…`.
4. React Native reinforcement — the react-android AAR already ships
   consumer rules that keep NativeModule / TurboModule / @ReactMethod
   surfaces, but the strict form is re-declared to survive future R8
   default-flag changes.
5. New Architecture keeps for codegen output (Fabric + TurboModules).
6. Reflection-heavy library keeps:
   `com.google.android.gms.**` (react-native-maps),
   `com.google.android.exoplayer2.**` / `androidx.media3.**`
   (react-native-video), `com.github.barteksc.pdfviewer.**` +
   `com.shockwave.**` (react-native-pdf), `com.oblador.vectoricons.**`.
7. `-assumenosideeffects android.util.Log` — R8 deletes every
   `Log.d/v/i/w/e(...)` call in native code from the release binary.
   This closes the native-side half of F-05 (JS side was already
   handled by `babel-plugin-transform-remove-console`).

The `SourceFile` attribute is renamed to a constant string so stack
traces stop leaking original `.kt` / `.java` filenames, while
`LineNumberTable` is preserved so `retrace` can still symbolicate a
release crash against `mapping.txt`.

### 2.4 Source map leak guard

`android/app/build.gradle` now runs a `mergeAssetsProvider.doLast`
verifier that fails the release build if any `.map` / `.hbcmap` /
`.bundle.map` file has snuck into the packaged assets. This is a
regression guard against future dependency bumps or
`bundleConfig` mis-configuration; it does not need to fire on a
correctly-configured RN 0.81 build.

---

## 3. Verifying the fix

### 3.1 Bundle string extraction (the "before / after" test)

```bash
# Build a release APK
cd android && ./gradlew assembleRelease && cd ..

# Path to the release APK
APK="android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"

# Extract the Hermes bundle
unzip -p "$APK" assets/index.android.bundle > /tmp/rksk-release.bundle

# 1. Bundle size — should be smaller than pre-F-15 (comments + dead
#    console calls removed).
ls -lh /tmp/rksk-release.bundle

# 2. Log lines — expect ZERO matches. `drop_console` in metro.config.js
#    plus F-05's Babel plugin plus `-assumenosideeffects Log.*` in
#    proguard-rules.pro should have deleted every log site.
strings /tmp/rksk-release.bundle | grep -Ei '^console\.|console\.log|console\.warn|console\.error' || echo "OK: no console calls"

# 3. TODO / FIXME / XXX comments — expect ZERO matches. `output.comments: false`
#    should have wiped every comment before Hermes compiled the bundle.
strings /tmp/rksk-release.bundle | grep -E 'TODO|FIXME|XXX|HACK' || echo "OK: no dev markers"

# 4. Function name mangling proof — even though we keep_fnames=true, local
#    variable names inside functions ARE renamed by Terser. Grep for
#    single-letter-followed-by-open-paren patterns; a well-minified
#    bundle has many.
strings /tmp/rksk-release.bundle | grep -cE '\b[a-z]\(' | head -1

# 5. Sensitive-string sanity check. The API URL is expected to be present
#    (the client has to know where the server lives). But `SECRET`,
#    `PRIVATE_KEY`, `AWS_`, and similar substrings must NOT be:
strings /tmp/rksk-release.bundle | grep -Ei 'secret|private[_-]?key|aws_access|aws_secret|firebase.*key' \
    || echo "OK: no obvious secret substrings"
```

### 3.2 DEX / native-class extraction

```bash
# Use apkanalyzer (ships with Android SDK CLI tools) to dump class names
$ANDROID_HOME/cmdline-tools/latest/bin/apkanalyzer dex packages \
    android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
    | sort -k4 -n -r | head -30
```

Before F-15: top of the list is `com.rkskmp.SecureToken`,
`com.rkskmp.integrity.IntegrityService`, and readable third-party
module names.

After F-15: top of the list is `a`, `b`, `c`, … (R8 has renamed all
non-kept classes to opaque symbols) mixed with the `-keep`-guarded
namespaces (`com.facebook.react.bridge.*`,
`com.google.android.gms.*`, `com.facebook.hermes.*`, and the app's
kept manifest-referenced entry points).

### 3.3 R8 mapping file

R8 emits `android/app/build/outputs/mapping/release/mapping.txt` which
maps `original.class.Name.originalMethod(SIG)` →
`renamed.class.Name.renamedMethod(SIG)`. This file MUST NOT be
committed to git or shipped in the APK (it's the answer key to the
obfuscation). Uploading it to Play Console → Deobfuscation files lets
Play symbolicate release crashes for you.

```bash
head -20 android/app/build/outputs/mapping/release/mapping.txt
```

Expect: `com.rkskmp.MainActivity -> com.rkskmp.MainActivity:` (kept
unchanged by `-keep public class * extends android.app.Activity`) and
`com.<some>.<internal>.SomeInternalClass -> a.a.a:` (mangled).

### 3.4 APK size delta

```bash
# Before F-15 (assumes you saved a copy)
du -h path/to/pre-f15-app-arm64-v8a-release.apk

# After F-15
du -h android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

Expected shrinkage: 8–15 MB depending on how much dead code / unused
resources R8 finds. If the delta is < 500 KB, R8 probably didn't run
(check `minifyEnabled` is `true` and the Gradle output shows an
`R8` task actually executed).

### 3.5 Source-map leak guard test

The guard added to `android/app/build.gradle` is a NEGATIVE test — it
only fires when it finds a `.map` in the merged assets. To manually
verify the guard is wired correctly:

```bash
# Force-inject a decoy .map file to prove the guard fires
touch android/app/src/main/assets/decoy.bundle.map
cd android && ./gradlew clean assembleRelease
#   → expect a GradleException citing "F-15: source map(s) [...] leaked"

rm android/app/src/main/assets/decoy.bundle.map
```

---

## 4. Handling Hermes source maps for crash symbolication

The release build generates a source map at:

```
android/app/build/generated/sourcemaps/react/release/index.android.bundle.map
```

This file is INTENTIONALLY produced (default `hermesFlags = ["-O",
"-output-source-map"]`) so it can be uploaded to a crash-reporting
service that symbolicates on the server side. It must NEVER end up
inside the APK — see §3.5.

Recommended workflow when a crash reporter is added:

1. Wire the crash reporter (Sentry / Firebase Crashlytics / Datadog RUM)
   into `App.js` at bootstrap time.
2. In CI, after `./gradlew bundleRelease`, upload the generated
   `.bundle.map` to the crash reporter using its CLI:
   * Sentry: `sentry-cli sourcemaps upload --release <VERSION>` against
     the map file.
   * Firebase: `firebase crashlytics:mappingfile:generateid` +
     `crashlytics:symbols:upload`.
3. Discard the map file — do not commit it, do not attach it to the
   Play release track, do not upload it to the same public bucket as
   the APK.

`mapping.txt` from R8 gets the same treatment for native stack traces:
upload to the same service (Play Console has a first-class slot for
this) and never ship it in-band.

---

## 5. Troubleshooting: R8 broke my release build

R8-induced crashes almost always fall into one of four categories.
Diagnose in this order:

### 5.1 `ClassNotFoundException` / `NoClassDefFoundError` at startup

Cause: R8 renamed a class that JS or reflection tries to look up by
string name.

Recipe:

```bash
# 1. Capture the crash class name from logcat / crash reporter
CLASS="com.example.SomeClass"

# 2. Locate the renamed symbol in the mapping file
grep -F "$CLASS" android/app/build/outputs/mapping/release/mapping.txt
# → SomeClass -> a.b.c:

# 3. Add a targeted -keep in proguard-rules.pro, e.g.:
#    -keep class com.example.SomeClass { *; }
```

Ask "is this a class the app calls by reflection?" (Class.forName,
newInstance, PackageManager query…). If yes, keep it. If no, the crash
is actually a bug in the caller — do NOT paper over it with a blanket
keep.

### 5.2 `NoSuchMethodError` after startup

Cause: R8 renamed a method that is invoked via reflection or annotation.

Recipe:

```bash
grep -F "originalMethodName" mapping.txt
# → com.example.SomeClass.originalMethodName(...) -> a.b(...):
```

Add:

```proguard
-keepclassmembers class com.example.SomeClass {
    void originalMethodName(...);
}
```

### 5.3 Native module crash: `NativeModule ... could not be found`

Cause: R8 stripped or renamed a `ReactPackage` implementation. The
consumer rules from react-android SHOULD have kept it — a violation
here usually means an autolinked library was published without the
`@ReactModule` annotation or without `implements NativeModule`.

Recipe:

1. Identify the offending library (usually visible in the JS stack
   trace of the caller).
2. Grep its `node_modules/<lib>/android/src/main/java` for
   `implements NativeModule` / `extends ReactContextBaseJavaModule`.
3. If found: file a bug against the library, in the meantime add:
   ```proguard
   -keep class com.<library-package>.** { *; }
   ```
4. If NOT found: the library is not actually a native module — its
   inclusion in the crash is a wiring bug, not an R8 bug.

### 5.4 Kotlin `KotlinReflectionInternalError`

Cause: `kotlin.Metadata` got renamed or an inline function's inline
data was stripped.

Recipe: verify §2.3 rule #2 (Kotlin runtime keeps) is present verbatim.
If a specific class needs its inline data preserved:

```proguard
-keepclassmembers class com.example.KotlinClass {
    @kotlin.jvm.JvmField <fields>;
}
```

### 5.5 Nuclear option (last resort, DO NOT SHIP)

If you cannot reproduce a crash under a debuggable release build,
temporarily add ONE of these to `proguard-rules.pro`:

```proguard
# Turns off renaming entirely — the F-15 fix is disabled by this line.
# -dontobfuscate

# Turns off code motion / inlining. Safer than -dontobfuscate.
# -dontoptimize
```

Rebuild, reproduce, capture the stack, fix the root cause, then
REMOVE the flag before you ship. Do not commit an enabled
`-dontobfuscate` — CI should reject it (a future addition would be a
grep-based pre-commit check).

---

## 6. What F-15 does NOT fix — non-goals and adjacent findings

Obfuscation is not confidentiality. Do not use it to hide anything
whose disclosure would be actually harmful:

1. **API endpoint URLs** live in the bundle as string literals and
   CANNOT be obfuscated (the app has to know where to connect). A
   `strings` on the release bundle will still reveal
   `http://139.5.6.137/RKSKUATAPI/api/` today. The correct mitigation
   for this is:
   - Certificate pinning at the network layer.
   - Server-side rate-limiting + WAF.
   - Play Integrity token attestation (tracked in F-13
     `android/INTEGRITY.md` §Roadmap).
   These are separate audit items; F-15 explicitly does not attempt
   to solve them.

2. **Hardcoded keys / secrets** — must not be in the bundle at all.
   F-08 (`android/SECRETS.md`) covers Google Maps key exfiltration.
   The residual `envSecrets.GOOGLE_API_KEY` value baked into
   `src/utils/constant/env.js` is still visible to `strings`; F-08's
   documentation covers the compensating controls
   (Cloud-Console-side application + API restrictions that make an
   extracted key useless).

3. **Business-logic strings** — validation regexes, workflow names,
   feature-flag identifiers. `output.comments: false` and `drop_console:
   true` remove the metadata AROUND these strings, but the strings
   themselves remain. If a specific value is truly sensitive,
   generate it server-side rather than embedding it.

4. **HTTP protocol strings** — `Bearer`, `Authorization`, `X-CSRF-Token`,
   etc. These are protocol constants; they should be visible and
   pinning-locked, not obfuscated.

5. **Native shared libraries (`.so`)** — F-10's `android/SUPPLY_CHAIN.md`
   covers the provenance concern for `libpdfium.so`. Native code
   obfuscation (renaming exported symbols with `-fvisibility=hidden`,
   stripping symbol tables) is enabled by AGP release defaults and is
   not further tightened by this file.

---

## 7. Follow-ups

- **Automated bundle string scanner in CI.** Wrap §3.1 into a small
  Node script (`scripts/bundle-audit.js`) invoked by CI post-build.
  Fail the pipeline if any denylisted substring appears
  (SECRET / PRIVATE_KEY / TODO / FIXME / logcat markers). Tracked
  alongside the F-12 `scripts/security-denylist.js` pattern.

- **Certificate pinning + endpoint move to https**. `src/utils/constant/index.js`
  currently ships `http://139.5.6.137/RKSKUATAPI/api/` — an HTTP (not
  HTTPS) staging endpoint. Migrating to the production HTTPS URL AND
  adding cert-pin via `react-native-ssl-pinning` or the RN network
  security config's `<pin-set>` is a separate audit item; obfuscation
  does not compensate for cleartext transport.

- **Play Integrity API for tamper detection.** F-13 tracks the roadmap.
  Once integrated, obfuscation becomes a delay-attacker, and
  server-verified attestation becomes the actual boundary.

- **Native library symbol stripping check.** Verify with
  `nm android/app/build/intermediates/stripped_native_libs/release/out/lib/arm64-v8a/libhermes.so`
  that exported symbols are minimal. AGP `stripReleaseDebugSymbols`
  runs by default; the check is regression-detection.
