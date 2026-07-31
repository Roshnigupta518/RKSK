# Native Library Path Hygiene (F-24)

This document explains how RKSK-MP prevents developer-identifying
absolute paths (`/Users/<name>`, `/home/<name>`, Gradle cache hashes,
Node version paths) from being embedded in the shipped native
libraries (`.so` files) inside the release APK/AAB.

Related finding: **F-24 — Developer path/username native libs me leak**.

---

## 1. The vulnerability

A stripped release build of RKSK 1.0.13 was shipping this string
inside `lib/arm64-v8a/libappmodules.so`:

```
/Users/Geeta/.gradle/caches/8.14.3/transforms/6ab28e5d6003888dc378c77ac39a79c0/
transformed/react-android-0.81.4-release/prefab/modules/reactnative/
include/react/renderer/core/propsConversions.h
```

A single line, but it exposes a lot:

| Datum | Sensitivity |
|-------|-------------|
| Developer's OS username (`Geeta`) | Doxxing / attribution risk |
| Developer's home directory layout | Reconnaissance for local-file exploits |
| Exact Gradle version (`8.14.3`) | Version-specific CVE targeting |
| Gradle cache transform hash | Reproducibility of the build environment |
| Exact React Native version (`0.81.4`) | Version-specific CVE targeting |
| Absolute file layout of a header | Signals build-time include-path structure |

Any of these on its own is a low-severity leak. Together, they let an
attacker:

1. Match the shipped APK to a specific developer identity (useful in
   supply-chain attacks against contract developers, or in targeted
   phishing of the individual whose username appears in the binary).
2. Reproduce the exact build environment for exploit development —
   the same Gradle version, RN version, and cache-transform layout —
   which makes it easier to iterate offensive tooling that has to
   understand our binary's memory layout.
3. Fail external app-store scanners: MobSF, Ostorlab, NowSecure, and
   Google Play's pre-launch report all flag hostname / username /
   `/Users/` / `/home/` substrings in native code as
   "Sensitive data hardcoded in binaries" (OWASP MASTG L1
   MASVS-STORAGE-1).

### 1.1 Why AGP's default strip does not fix it

AGP strips DWARF debug sections (`.debug_info`, `.debug_line`,
`.debug_str`, etc.) from release `.so` files before packaging. That's
what shrinks `libappmodules.so` from ~30 MB in
`intermediates/merged_native_libs/` to ~1.4 MB in the packaged APK.

But strip only touches the `.debug_*` sections. The offending path
strings live in the `.rodata` section (read-only data), which strip
never touches — the loader needs `.rodata` at runtime.

Path strings enter `.rodata` when a C/C++ compilation unit expands
the `__FILE__` preprocessor macro, either directly or via a macro
that captures `__FILE__` in an error message, assertion, or log
call. Every such expansion becomes a string literal in `.rodata`
containing whatever absolute path Clang used to locate the source
file at compile time.

The only reliable way to sanitize `.rodata` is to **prevent** the
paths from being embedded during compilation — you cannot remove
them afterward without corrupting the binary.

### 1.2 The specific mechanism in RKSK

The header `react/renderer/core/propsConversions.h` (shipped inside
the `react-android` AAR's prefab package) contains code shaped like:

```cpp
// Illustrative — actual RN source may differ slightly.
#define REACT_ASSERT(x) \
  do { if (!(x)) { logAssertion(#x, __FILE__, __LINE__); } } while (0)
```

When our app's codegen-emitted C++ (`libappmodules.so` sources)
`#include`s this header from the prefab-transform directory, clang
compiles the assertion with `__FILE__` expanded to the absolute
path of `propsConversions.h` as it was located via the `-I` include
path. That absolute path — `/Users/Geeta/.gradle/caches/...` — then
becomes a plain-text `.rodata` entry.

The same mechanism can fire for any header in `node_modules` /
Gradle cache / NDK sysroot that uses `__FILE__` in an inline macro.
`propsConversions.h` was simply the one that happened to be hit by
RKSK's active codegen paths.

---

## 2. The fix — three layers

### 2.1 Layer 1: `-ffile-prefix-map` (prevention)

Set at THREE scopes for full coverage:

1. `android/app/build.gradle` — `defaultConfig.externalNativeBuild.cmake`
   → covers `:app`'s own CMake compile (produces `libappmodules.so`)
2. `android/app/build.gradle` — `buildTypes.release.externalNativeBuild.cmake`
   → belt-and-braces repetition against AGP flag-inheritance changes
3. `android/build.gradle` — root-level `subprojects { … }` block
   → covers EVERY Android library subproject's CMake build
   (`:react-native-worklets`, `:react-native-screens`,
   `:react-native-gesture-handler`, `:react-native-reanimated`, etc.)

**Why the subprojects propagation is required.** RN autolinked
native modules live in their own subprojects with independent AGP
configs. App-level cFlags don't reach them. The initial F-24 fix
missed this, and the release-build guard on 2026-07-31 revealed
that 8 of 10 leaking `.so` files were subproject artifacts:

```
libworklets.so:        /Users/Geeta/…/node_modules/react-native-worklets/…
librnscreens.so:       /Users/Geeta/…/node_modules/react-native-screens/…
libgesturehandler.so:  /Users/Geeta/…/node_modules/react-native-gesture-handler/…
libreanimated.so:      /Users/Geeta/Library/Android/sdk/ndk/27.1.…/toolchains/…
```

The subprojects block uses `plugins.withId('com.android.library')`
(fully lazy) rather than `afterEvaluate { }`, avoiding the "Cannot
run Project.afterEvaluate(Closure) when the project is already
evaluated" trap that F-10 hit with CycloneDX.

The pattern used at all three scopes:

```groovy
externalNativeBuild {
    cmake {
        def homeDir = System.getProperty("user.home")
        def gradleUserHome = "${homeDir}/.gradle"
        def projectRoot = rootProject.projectDir.absolutePath
        def pathHygieneFlags = [
            "-ffile-prefix-map=${projectRoot}=/rksk",
            "-ffile-prefix-map=${gradleUserHome}=/gradle-cache",
            "-ffile-prefix-map=${homeDir}=/home",
        ].join(" ")

        cFlags   pathHygieneFlags
        cppFlags pathHygieneFlags
    }
}
```

`-ffile-prefix-map=SRC=DST` is a Clang flag (also supported by GCC
8+) that rewrites every path Clang emits from `SRC*` to `DST*`.
Coverage per
[the Clang docs](https://clang.llvm.org/docs/ClangCommandLineReference.html#cmdoption-clang-ffile-prefix-map):

* `__FILE__` and `__BASE_FILE__` macro expansions
* `__builtin_FILE()` builtin
* DWARF `DW_AT_comp_dir` and `DW_AT_decl_file`
* `__has_include` diagnostic strings
* Assertion / `static_assert` diagnostic strings

`-ffile-prefix-map` supersedes and IMPLIES both
`-fdebug-prefix-map` (DWARF-only) and `-fmacro-prefix-map`
(macro-only). One flag covers everything.

#### Prefix-map ordering — LAST match wins in Clang

Per [Clang's documented semantics](https://clang.llvm.org/docs/ClangCommandLineReference.html#cmdoption-clang-ffile-prefix-map):

> When multiple `-ffile-prefix-map` options are given, later ones
> take precedence.

So when a path could match more than one rule, the **last-declared**
matching rule wins. Therefore mappings are declared from **broadest
to narrowest**:

| Declaration order | Source prefix | Destination | Catches |
|-------------------|---------------|-------------|---------|
| 1 (broadest) | `<homeDir>` (e.g. `/Users/Geeta`) | `/build-home` | Any path under `$HOME` not covered by rule 2 or 3 — NDK toolchain (`~/Library/Android/sdk/ndk/…`), Yarn global cache, npm `_prebuilt` cache, custom NDK sysroot overrides |
| 2 (medium) | `<homeDir>/.gradle` | `/gradle-cache` | `~/.gradle/caches/**` transform outputs (source of the original `propsConversions.h` leak) |
| 3 (narrowest, LAST) | `<projectRoot>` (e.g. `/Users/Geeta/Desktop/NHM/rksk`) | `/rksk` | `node_modules/**`, `android/**`, app-specific source paths |

**Why the destination is `/build-home` (not `/home`).** The F-24
release-build guard flags `/home/` as a Linux leak indicator. If we
remapped `$HOME` to `/home`, the guard would trip on our OWN
rewrite output (`/home/Desktop/NHM/rksk/…`) — a false positive that
also implies the path is still leaking. `/build-home` is
unambiguous, doesn't collide with any guard needle, and clearly
signals "this was a build-machine home directory."

**Why the ordering was inverted in the initial fix (regression
lesson from 2026-07-31).** The first F-24 fix declared the
mappings in the natural "specific-first" intuition, and the
release-build guard produced this diagnostic:

```
excerpt: /home/Desktop/NHM/rksk/node_modules/react-native-worklets/…
```

Because Clang's last-wins meant the `<homeDir>` rule (declared
last) overrode the `<projectRoot>` rule, every project-tree path
collapsed to `/home/Desktop/NHM/rksk/…` — leak-free (aside from
tripping the guard's `/home/` needle) but discarding the readable
`/rksk/…` distinction. Reversing the order to broadest-first
resolves both problems.

#### NDK compatibility

`-ffile-prefix-map` requires:

* Clang **6+** for `-fdebug-prefix-map` (the DWARF half)
* Clang **10+** for `-fmacro-prefix-map` (the `__FILE__` half)
* Clang **10+** for the unified `-ffile-prefix-map` flag

NDK ships with:

| NDK release | Clang version | `-ffile-prefix-map`? |
|-------------|---------------|----------------------|
| r21 | Clang 9 | Partial (debug only) |
| r22 | Clang 11 | Full |
| r23 | Clang 12 | Full |
| r25 | Clang 14 | Full |
| r27 | Clang 18 | Full |

RKSK pins NDK r27 (see `android/build.gradle` `ndkVersion`), so all
three flags are fully supported.

### 2.2 Layer 2: Release-build guard (detection)

`android/app/build.gradle` hooks the `mergeReleaseNativeLibs` task
and scans every `.so` file it produces for known-bad substrings:

```
/Users/            // macOS absolute path
/home/             // Linux absolute path
/Volumes/          // macOS external-volume path
C:\Users\          // Windows absolute path (dev boxes)
<current username> // machine-specific
<current $HOME>    // machine-specific
```

Any hit produces a `GradleException` that lists every offending
file with the leaked needle, the reason it's a leak, and an ASCII
excerpt of the surrounding bytes.

#### Upstream-leak allowlist

The guard also carries a `upstreamLeakAllowlist` — a small,
explicitly-documented set of (file-pattern, context-needle) pairs
that suppress hits for known, investigated, and unfixable
prebuilt `.so` files. Each entry documents an upstream binary
that ships with a leak we cannot prevent locally, along with
the threat-model justification for tolerating it.

Current entries:

| File | Context needle | Rationale |
|------|----------------|-----------|
| `libfbjni.so` | `/home/runner/work/fbjni/` | Facebook fbjni prebuilt, shipped via `com.facebook.fbjni:fbjni-*` (a Gradle dependency of `react-android`). Leak is GitHub Actions runner path from Meta's public OSS CI; non-identifying to RKSK; unfixable without vendoring fbjni. |

The suppression is narrow: it requires the specific
`contextNeedle` to appear within ±200 bytes of the flagged hit,
so a *novel* leak in the same file that lacks this context still
fires the guard.

Adding to the allowlist is a **deliberate act** — every entry
documents an unfixable leak and its threat-model justification.
The default is fail-closed. See §4.2 for the upstream-fix
preference order. Sample failure output:

```
F-24: native library path-leak detected in mergeReleaseNativeLibs
output. The following .so files contain absolute build-machine
paths that would ship in the release APK:

  file:    ./android/app/build/intermediates/merged_native_libs/...
  needle:  "/Users/" (macOS absolute path)
  excerpt: ...ropsConversions.h·/Users/Geeta/.gradle/caches/...

Common causes and fixes:
  * A new RN module or upstream AAR ships a prebuilt .so...
  * A native module the app builds locally is missing
    -ffile-prefix-map coverage...
See android/NATIVE_PATH_HYGIENE.md for full remediation.
```

The guard is scoped to `mergeReleaseNativeLibs` (release-only) so
debug builds keep paths for stack-trace analysis and the
`installDebug` inner loop stays fast. Total scan time on a full
release build is under one second across ~20 MB of `.so` files.

### 2.3 Layer 3: Documentation (this file)

Provides:

* Threat model (§1)
* Fix mechanics (§2)
* Verification recipes (§3)
* Troubleshooting (§4)
* Non-goals + follow-ups (§5)

Together, layers 1 + 2 ensure the fix cannot silently regress:
prevention stops new paths from entering, and detection catches
paths shipped by prebuilt `.so` files that bypass our compile
flags entirely.

---

## 3. Verification

### 3.1 Verify no leaks in the current release APK

```bash
cd /Users/Geeta/Desktop/NHM/rksk
./gradlew clean :app:assembleRelease
mkdir -p /tmp/f24-verify
unzip -q android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
  'lib/arm64-v8a/*.so' -d /tmp/f24-verify

echo "==== macOS/Linux/Volumes path leaks ===="
for f in /tmp/f24-verify/lib/arm64-v8a/*.so; do
  hits=$(strings "$f" | grep -cE '/Users/|/home/|/Volumes/')
  [ "$hits" -gt 0 ] && echo "  $f: $hits hits"
done

echo "==== Current build-machine username leak ===="
for f in /tmp/f24-verify/lib/arm64-v8a/*.so; do
  hits=$(strings "$f" | grep -cE "$(whoami)")
  [ "$hits" -gt 0 ] && echo "  $f: $hits hits"
done
```

Expected output: no lines printed. If either loop prints a filename,
the fix has regressed — read §4 for the diagnostic playbook.

### 3.2 Verify the Gradle guard fires on regression

```bash
# Temporarily deactivate the -ffile-prefix-map flags by commenting
# out the `cFlags`/`cppFlags` lines in android/app/build.gradle,
# then run:
./gradlew clean :app:mergeReleaseNativeLibs

# Expect:
#   FAILURE: F-24: native library path-leak detected in mergeReleaseNativeLibs
#   output. The following .so files contain absolute build-machine paths...

# Restore the flags after verification.
```

### 3.3 Verify Clang applies the flags

To confirm the flags reach the compiler rather than being dropped
silently by AGP / the RN Gradle plugin:

```bash
./gradlew :app:mergeReleaseNativeLibs --info 2>&1 \
  | grep -oE '\-ffile-prefix-map=\S+' | sort -u
```

Expected output (paths will vary per machine):

```
-ffile-prefix-map=/Users/Geeta/.gradle=/gradle-cache
-ffile-prefix-map=/Users/Geeta/Desktop/NHM/rksk=/rksk
-ffile-prefix-map=/Users/Geeta=/home
```

### 3.4 Verify DWARF remap (defense-in-depth)

Even though AGP strips DWARF sections before packaging, the
INTERMEDIATE `.so` (under `android/app/build/intermediates/cxx/`) is
unstripped and can be inspected as a sanity check that the remap
covers debug info too:

```bash
UNSTRIPPED=$(find android/app/build/intermediates/cxx \
  -name 'libappmodules.so' -path '*/RelWithDebInfo/*' | head -1)
strings "$UNSTRIPPED" | grep -E '(DW_AT_comp_dir|DW_AT_decl_file)' | head -3
# Or, with a proper ELF reader (NDK's llvm-readelf):
$ANDROID_HOME/ndk/27.*/toolchains/llvm/prebuilt/*/bin/llvm-dwarfdump \
  "$UNSTRIPPED" | grep -A1 DW_AT_comp_dir | head -20
```

Expected: every `DW_AT_comp_dir` and `DW_AT_decl_file` path should
begin with `/rksk`, `/gradle-cache`, or `/home` — never `/Users/`,
`/home/<username>`, etc.

### 3.5 Play Console pre-launch report

Upload the release AAB to an internal testing track. The
"Sensitive data in native libraries" section of the pre-launch
report must not list any `/Users/`, `/home/`, or hostname
substrings.

---

## 4. Troubleshooting

### 4.1 The guard fires on a fresh clone

Symptom: `assembleRelease` fails with `F-24: native library path-leak
detected` on the first release build after cloning.

Likely cause: the developer's machine has an unusual `$HOME` layout
(macOS Firmlink, Linux bind mount, symlinked home) where the path
Java reports as `System.getProperty("user.home")` differs from the
path Clang actually embeds.

Fix: resolve both to their canonical form and add the canonical
form to the prefix-map set. Example:

```groovy
def homeDir = new File(System.getProperty("user.home")).canonicalPath
def altHomeDir = System.getProperty("user.home")
def pathHygieneFlags = [
    "-ffile-prefix-map=${homeDir}=/home",
    "-ffile-prefix-map=${altHomeDir}=/home",
].join(" ")
```

### 4.2 The guard fires on an AAR-shipped .so

Symptom: the excerpt shows a path from someone else's machine
(e.g. `/Users/tomasino`, `/home/circleci`), meaning an upstream
RN module shipped a prebuilt `.so` with leaks embedded.

Fix options (in order of preference):

1. **File an upstream issue.** Prebuilt `.so` files leaking author
   paths is a legitimate supply-chain finding — the maintainer
   should adopt `-ffile-prefix-map` in their CI.
2. **Vendor a patched build.** If the upstream is slow, use
   `patch-package` to swap the prebuilt `.so` for a locally-built
   version compiled with our flags. See `android/AUDIO_STRIP.md`
   (F-18) for a working `patch-package`-based mitigation example.
3. **Denylist the module.** If the leaked path is high-value
   (e.g. it reveals the module maintainer's private CI hostname),
   consider removing the module from RKSK's dependency set.

### 4.3 The guard fires with a false positive

Genuine false positives are extremely rare because the substrings
we search for (`/Users/`, `/home/`, `/Volumes/`, `C:\Users\`) don't
occur in legitimate C++ symbol names, RTTI signatures, or JNI
descriptors.

If you believe a hit is a false positive:

1. Extract the `.so` and confirm the surrounding bytes with
   `strings <so> | grep -n '<needle>' | head`.
2. If the string is unambiguously benign (e.g. a URL-like comment
   in a licence blob that happens to contain `/home/`), the
   needle list can be tightened — but prefer to file an issue
   and discuss before touching the guard. The default is
   fail-closed.

### 4.4 CI failing but local passes (or vice versa)

Cause: `System.getProperty("user.name")` and
`System.getProperty("user.home")` are evaluated at task-execution
time on the machine running the build. A CI runner's username
(`runner`, `circleci`, `github-actions`) is unlikely to occur in
a `.so` compiled on a developer's laptop, and vice versa. This is
the intended behaviour — each build machine's guard verifies its
OWN leak surface.

If you're seeing surprising cross-machine misses, verify that
`-ffile-prefix-map` was applied on the machine that produced the
`.so` (`./gradlew … --info | grep ffile-prefix-map`).

### 4.5 The flags don't reach Clang at all

Symptom: §3.3 shows no `-ffile-prefix-map=…` lines in the Gradle
info output.

Cause: AGP + `com.facebook.react` sometimes reset `cFlags` /
`cppFlags` when the RN autolinking code rewrites the CMake
project. To confirm, dump the actual command line:

```bash
./gradlew clean :app:externalNativeBuildRelease --info 2>&1 \
  | grep -oE '"[^"]*clang\+\+[^"]*"' | head -1
```

If the clang command line lacks `-ffile-prefix-map`, escalate to
maintainers-of-record; a temporary workaround is to set
`ORG_GRADLE_PROJECT_CMAKE_C_FLAGS` /
`ORG_GRADLE_PROJECT_CMAKE_CXX_FLAGS` environment variables which
AGP always honours.

---

## 5. Non-goals + follow-ups

### 5.1 Non-goals

* **Symbol-name obfuscation.** Function names in `.dynsym` are
  needed by the dynamic loader and cannot be safely stripped or
  renamed. F-24 does not attempt this. F-15 handles the parallel
  concern for Java/Kotlin classes via R8.

* **Rewriting paths in shipped prebuilt AARs.** RKSK's guard flags
  a leak but does not automatically patch third-party binaries.
  Upstream fixes are always preferred.

* **NDK toolchain path leaks.** Paths under
  `$ANDROID_HOME/ndk/*/toolchains/llvm/…` sometimes appear in
  compiler error messages embedded in `.rodata`. These are
  build-machine-neutral and not developer-identifying, so they're
  intentionally not caught by the current needle set. If Play
  Console scanners begin flagging them in the future, extend the
  guard.

### 5.2 Follow-ups

* Extend the guard to also scan the Hermes bytecode bundle for
  path leaks. Hermes bytecode can retain source-map paths that
  identify the developer's `node_modules` layout; F-15's Metro
  minifier config already strips most of this, but a defence-
  in-depth grep of the bundle would be a small addition.

* Add a `strings` variant of the guard for CI that also scans
  the release AAB (not just the APK output of `assembleRelease`)
  so builds that skip straight to `bundleRelease` on CI don't
  bypass the guard.

* Consider running the guard on debug builds too, gated behind a
  Gradle property (`-Pf24.strictDebug`). Not a default because
  it adds ~1 s to the incremental `installDebug` cycle and debug
  leaks aren't distributed to end users.

---

## 6. Change log

| Date | Change | Finding |
|------|--------|---------|
| 2026-07-30 | Introduced `-ffile-prefix-map` at defaultConfig + release scope; added `mergeReleaseNativeLibs` scanner; authored this document. | F-24 |
| 2026-07-31 | Post-verification regression fix: (a) reordered prefix-map flags broadest → narrowest to work with Clang's last-wins semantics; (b) changed `$HOME` destination from `/home` to `/build-home` so it doesn't collide with the guard's `/home/` leak needle; (c) added root-level `subprojects` propagation covering `:react-native-worklets`, `:react-native-screens`, `:react-native-gesture-handler`, `:react-native-reanimated`, etc.; (d) added narrow `upstreamLeakAllowlist` for Facebook fbjni's unfixable `/home/runner/work/fbjni/` prebuilt path. | F-24 |

When editing this file, add a new row with the date, a one-line
summary, and the finding ID (or "MAINT" for maintenance-only
changes).
