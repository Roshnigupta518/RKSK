# F-18 — LAME 3.100 + JLayer 1.0.1 excision from `react-native-compressor`

Status: **fixed** (patch-package + Gradle exclusion + postinstall regression guard)
Owner: Frontend/Android security workstream
Related findings: F-10 (SBOM / native supply-chain provenance), F-15 (obfuscation)

---

## 1. Why this exists

The L1 security audit flagged that the release APK bundled **LAME 3.100**, an
open-source MP3 encoder that has been unmaintained since October 2017. The
encoder ships as JNI-invocable Kotlin/Java bytecode and, once loaded at
runtime, becomes a large parser attack surface exposed to any code path
that can feed it audio bytes. The public CVE record for LAME 3.100
includes at minimum:

| CVE            | Effect                                                                            |
| :------------- | :-------------------------------------------------------------------------------- |
| CVE-2017-13712 | Buffer over-read in `II_step_one` on crafted MPEG frames                          |
| CVE-2017-13713 | Buffer overflow in `fill_buffer_resample` on non-standard sample rates            |
| CVE-2017-13714 | NULL pointer dereference in `parse.c`                                             |
| CVE-2017-13715 | Buffer overflow via crafted WAV/AIFF headers                                      |
| CVE-2017-15018 | Heap overflow in `fill_buffer` triggered by attacker-controlled channel counts    |
| CVE-2017-15046 | Buffer overflow in the ID3 tag copy path                                          |
| CVE-2018-10777 | NULL deref in `III_dequantize_sample`                                             |
| CVE-2018-10778 | NULL deref in `III_i_stereo`                                                      |
| CVE-2018-10779 | NULL deref in `III_hybrid`                                                        |

The upstream project has published no releases and merged no patches since
`3.100` (2017-10-13). This is effectively abandoned code that continues to
ship in downstream libraries.

The bundling vehicle for RKSK is
[`react-native-compressor`](https://github.com/numandev1/react-native-compressor)
1.13.0, whose `android/build.gradle` declared:

```groovy
implementation 'com.github.banketree:AndroidLame-kotlin:v0.0.1'   // wraps LAME 3.100
implementation 'javazoom:jlayer:1.0.1'                            // MP3 decoder, last release 2008-11-27
```

The Kotlin wrapper `AndroidLame-kotlin:v0.0.1` is JitPack-hosted (not
Maven Central), has never had a follow-up release, and statically embeds
LAME 3.100 as a JNI blob. `javazoom:jlayer:1.0.1` (a pure-Java MP3
decoder) has similar issues — the last release predates modern secure
coding practice by nearly two decades and has documented integer
overflows in MPEG frame parsing.

## 2. Why we can excise it entirely (rather than upgrade)

`react-native-compressor` exposes three top-level APIs: `Image`, `Video`,
and `Audio`. RKSK's only compression call-site is
[`src/components/compressMedia/index.js`](../src/components/compressMedia/index.js):

```javascript
import {Image, Video} from 'react-native-compressor';
```

Note the import list: **no `Audio`**. The whole audio compression path
is dead code from the JS surface. It only exists in the APK because the
Kotlin package layout bundles `Audio/AudioCompressor.kt` in the same
Android library as `Video/*` and `Image/*`, and those in turn depend on
the two problematic packages by way of `dependencies { ... }` in the
library's `build.gradle`.

Since RKSK does not call `Audio.compress()` from JS and has no roadmap
item that requires audio compression, the least-invasive fix is:

1. Neutralise the `AudioCompressor.kt` implementation so it no longer
   references LAME/JLayer symbols.
2. Drop the two problematic Gradle deps so their `.aar` / `.jar` payloads
   are not merged into the final APK.

## 3. What the fix does, in three layers

### Layer 1 — `patch-package` for `react-native-compressor@1.13.0`

`patches/react-native-compressor+1.13.0.patch` (generated with
`patch-package`) applies two edits to the package inside `node_modules/`:

1. Replaces `android/src/main/java/com/reactnativecompressor/Audio/AudioCompressor.kt`
   with a minimal stub that:
    - Keeps the `AudioCompressor` class name.
    - Keeps `const val TAG = "AudioMain"` (Utils.kt reads it on every
      video/image compression, so removing it would break the file that
      references `AudioCompressor.TAG` at line 156 of Utils.kt).
    - Keeps `@JvmStatic fun CompressAudio(String, ReadableMap, ReactApplicationContext, Promise)`
      with a body that rejects the JS promise (`F18_AUDIO_DISABLED`)
      instead of invoking LAME/JLayer.
    - Removes *every* `import` referencing `com.naman14.androidlame.*`
      or `javazoom.jl.*`, and every field / local whose declared type
      pointed at those packages. Kotlin's `const val TAG` inlines the
      string at compile time, and no other symbol reference remains.
2. Removes the two `implementation` lines from `android/build.gradle`:
    ```groovy
    // implementation 'com.github.banketree:AndroidLame-kotlin:v0.0.1'
    // implementation 'javazoom:jlayer:1.0.1'
    ```
    They are left in as `//`-commented markers so a `grep` in the future
    quickly explains why the deps are absent.

The `postinstall` npm script runs `patch-package --error-on-fail` before
anything else, so if the patch stops applying cleanly after a version
bump, the install halts.

### Layer 2 — Gradle-level `configurations.all { exclude ... }`

`android/app/build.gradle` also adds:

```groovy
configurations.all {
    exclude group: 'com.github.banketree', module: 'AndroidLame-kotlin'
    exclude group: 'javazoom',             module: 'jlayer'
}
```

This is defense-in-depth: even if the patch fails to apply, or another
transitive path (an unrelated library that also happens to depend on
LAME/JLayer) tries to pull the same coordinates, Gradle refuses to
resolve them project-wide.

### Layer 3 — Postinstall regression guard

`scripts/security-denylist.js` (from F-12/F-16) now includes a
`STRIPPED_TRANSITIVE_DEPS` table. Every entry declares:
- The finding it closes (`F-18`).
- The npm package it targets.
- Filesystem paths inside `node_modules/` to scan post-patch.
- Substrings that must NOT appear as live code — Kotlin identifiers like
  `LameBuilder`, `WaveReader`, `com.naman14.androidlame`,
  `JavaLayerException`, and `javazoom.jl.`, plus Gradle coordinate
  strings scoped to non-comment lines.

The check runs AFTER `patch-package` in the `postinstall` script:

```json
"postinstall": "patch-package --error-on-fail && node scripts/security-denylist.js"
```

The ordering matters: `patch-package` mutates `node_modules`, and only
then does the regression guard grep for symbols. If the patch went
stale and applied the wrong thing, the grep catches it and fails the
install with a diagnostic pointing back to this document.

## 4. Verification — how to prove LAME is not in the APK

### 4.1 Source-level (post-`npm install`)

From the repo root:

```bash
grep -rn 'LameBuilder\|WaveReader\|com\.naman14\.androidlame\|JavaLayerException\|javazoom\.jl\.' \
  node_modules/react-native-compressor/android/src \
  node_modules/react-native-compressor/android/build.gradle
```

Expected: **no matches** in code (the only surviving mentions are the
`//`-commented markers left in `build.gradle` as documentation
breadcrumbs and the KDoc header in the stubbed `AudioCompressor.kt`).

### 4.2 Gradle dependency tree

```bash
cd android
./gradlew :app:dependencies --configuration releaseRuntimeClasspath | grep -iE 'lame|jlayer|androidlame'
```

Expected: **no matches**. If Gradle prints anything containing `lame`
or `jlayer`, the exclusion is not effective — investigate whether a
new transitive dep is pulling them in.

### 4.3 Final APK content

Build a release APK, then:

```bash
# Kotlin class file names inside the DEX
apkanalyzer dex packages app-release.apk | grep -iE 'AudioCompressor|LameBuilder|javazoom'
# Expected: exactly one line for the stubbed AudioCompressor class, and NOTHING else.

# Native code
unzip -l app-release.apk | grep -iE 'lame|libmp3|libmpg'
# Expected: no matches.

# JAR resources
unzip -p app-release.apk classes.dex | strings | grep -iE 'lame|libmp3lame|LAME_VERSION' | head
# Expected: no matches.
```

## 5. What the fix does NOT do

- It does **not** restore audio compression. Anyone calling
  `require('react-native-compressor').Audio.compress(...)` from JS
  will receive a rejected promise with error code
  `F18_AUDIO_DISABLED` and a diagnostic pointing here.
- It does **not** claim to strip audio codecs used by other libraries
  (e.g. `react-native-video`'s ExoPlayer stack, which handles playback
  and does not embed LAME). Those are a separate audit item.
- It does **not** patch the iOS side of `react-native-compressor`
  (see [`ios/Audio/`](../node_modules/react-native-compressor/ios/Audio)).
  RKSK ships Android today, so the iOS Audio path was left alone;
  when iOS ships, revisit this document and mirror the strip.

## 6. If the app ever legitimately needs audio compression

Do not restore LAME 3.100. Instead:

1. Use Android's built-in `MediaCodec` with the `audio/mp4a-latm` (AAC-LC)
   encoder — supported on every device with API ≥ 18, hardware-accelerated
   on most, and maintained as part of the OS with security fixes
   delivered by Google.
2. If MP3 output is a hard requirement, adopt an actively-maintained
   encoder such as [`libshine`](https://github.com/toots/shine) or a
   maintained FFmpeg fork. Never take a JitPack dependency of the form
   `com.github.<user>:*` unless the upstream is actively maintained
   AND the coordinate is pinned to a specific commit SHA (JitPack tags
   are mutable).
3. Regenerate this document with the new dependency's provenance,
   include the SBOM impact under F-10, and remove the corresponding
   entry from `STRIPPED_TRANSITIVE_DEPS` in
   `scripts/security-denylist.js`.

## 7. Regenerating the patch after a `react-native-compressor` bump

If you bump `react-native-compressor` (say, from 1.13.0 to 1.14.0),
patch-package will fail to apply the existing patch and the install
will halt. Regenerate the patch by:

```bash
# 1. Confirm the new version is worth adopting — read its CHANGELOG for
#    any audio-encoder migration (they may have removed AndroidLame
#    upstream, which would let us delete this whole file).
npm view react-native-compressor@X.Y.Z

# 2. Remove the stale patch and rebuild node_modules.
rm patches/react-native-compressor+*.patch
rm -rf node_modules/react-native-compressor
npm install --no-postinstall

# 3. Inspect the new upstream:
grep -rn 'lame\|jlayer' node_modules/react-native-compressor/android

# 3a. If upstream removed LAME/JLayer — you're done. Delete this file
#     (android/AUDIO_STRIP.md), delete the STRIPPED_TRANSITIVE_DEPS
#     entry in scripts/security-denylist.js, delete the
#     configurations.all block in android/app/build.gradle. Note the
#     change under F-10 SBOM and commit.
# 3b. If upstream still ships LAME/JLayer — re-apply the strip:

# 4. Re-run the source-level edits (stub AudioCompressor.kt, delete
#    the two implementation lines from the compressor's build.gradle).
#    Copy from git history if it helps.

# 5. Regenerate the patch file.
npx patch-package react-native-compressor

# 6. Verify by running the postinstall guard.
node scripts/security-denylist.js && echo OK
```

## 8. Upstream issue template

If you have a spare moment, please file the following issue against
`react-native-compressor` — the ecosystem benefits from every
downstream that speaks up:

> ### `AudioCompressor` depends on unmaintained LAME 3.100 and JLayer 1.0.1
>
> `android/build.gradle` currently declares:
>
> ```groovy
> implementation 'com.github.banketree:AndroidLame-kotlin:v0.0.1'
> implementation 'javazoom:jlayer:1.0.1'
> ```
>
> The wrapped LAME 3.100 has multiple public CVEs
> (2017-13712 through 2018-10779) and has been unmaintained since
> October 2017. JLayer 1.0.1 was last released November 2008.
>
> Downstream apps that only need `Image` and `Video` compression pay
> both the size cost and the attack-surface cost of these bundled
> encoders. Would you consider one of:
>
> 1. Moving the Audio path behind an optional Gradle flavour so
>    consumers can opt out?
> 2. Migrating the Android Audio path to `MediaCodec`'s built-in
>    AAC encoder (same as the iOS path essentially does via
>    `AVAudioConverter`)?
> 3. Splitting `react-native-compressor` into `-image`, `-video`,
>    `-audio` packages so consumers select the surface they need?
>
> Happy to send a PR if any of these directions is welcome.

## 9. Change log

- **2026-07-30** — F-18 fix committed. `AudioCompressor.kt` stubbed,
  Gradle deps removed, patch-package generated, app-level
  `configurations.all` guard added, postinstall
  `STRIPPED_TRANSITIVE_DEPS` check added, this document created.
