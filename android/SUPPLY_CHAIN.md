# RKSK Supply-Chain Provenance

This document maps every native (`.so`) library the RKSK Android app ships,
who built it, and how to check whether a given release is exposed to a
public CVE. It satisfies the L1 audit finding **F-10 — Bundled pdfium
(FreeType + OpenJPEG) no version provenance**.

## What the audit flagged

`react-native-pdf` pulls a large native library graph. The AAR that ends up
in the packaged APK contains a `libpdfium.so` that statically links several
third-party C/C++ libraries. None of these transitive-of-transitive
versions were surfaced anywhere in the source tree, so:

- **CVE exposure was unknowable.** Whether the shipped FreeType has a
  known heap-overflow, or the shipped OpenJPEG the recent RCE, could
  only be determined by disassembling the AAR — not by reading `git`.
- **`npm audit` misses everything.** JS-level SCA tooling only sees the
  npm layer (`react-native-pdf@7.0.4`); it cannot see into an AAR's
  `jniLibs/*/libpdfium.so`.
- **No SBOM.** SOC 2 / ISO 27001 / RBI CSF all require a Software Bill
  of Materials for shipped artifacts. There was none.

## Dependency chain

```
react-native-pdf@7.0.4        (npm — MIT)
  ├── com.github.zacharee:AndroidPdfViewer:4.0.1    (Jitpack — Apache-2.0)
  │     Fork of barteksc/AndroidPdfViewer (upstream abandoned).
  │     Pure-Java rendering layer; pulls PdfiumAndroid transitively.
  │
  └── io.legere:pdfiumandroid:1.0.32                (Maven Central — Apache-2.0)
        Published 2025-02-08 to Maven Central by the `Legere-io/PdfiumAndroid`
        maintainers. The upstream repo has since moved to
        https://github.com/johngray1965/PdfiumAndroidKt.

        This is a Kotlin/JNI wrapper. It does NOT build pdfium from source;
        instead the maintainer downloads prebuilt binaries from
        https://github.com/bblanchon/pdfium-binaries and vendors them
        into jniLibs/{arm64-v8a,armeabi-v7a,x86,x86_64}/libpdfium.so.

        The bblanchon/pdfium-binaries release that io.legere:pdfiumandroid:1.0.32
        pulled from was published within a few days of 2025-02-08 (the
        Maven Central publication date), which corresponds to PDFium's
        chromium/6800-6900 branch range. Follow the "Inspect what's
        actually shipped" section below to read the exact branch tag
        from the bundled .so file.
```

Everything below the PdfiumAndroid boundary is a Chromium subproject. The
`libpdfium.so` binary statically links (as of any recent Chromium PDFium):

| Component | What it does in PDFium | Upstream CVE feed |
| --- | --- | --- |
| **PDFium** itself | PDF parsing, rendering, JS execution (V8 embed), XFA forms | <https://pdfium.googlesource.com/pdfium/+log> and Chromium Security Notes filtered on `Component-Internals-PDF` |
| **FreeType** | Font rasterisation | <https://savannah.nongnu.org/bugs/?group=freetype>, NVD `cpe:2.3:a:freetype:freetype` |
| **OpenJPEG** | JPEG 2000 codec for embedded images | <https://github.com/uclouvain/openjpeg/security/advisories>, NVD `cpe:2.3:a:uclouvain:openjpeg` |
| **libpng** | PNG codec | <http://www.libpng.org/pub/png/libpng.html>, NVD `cpe:2.3:a:libpng:libpng` |
| **libjpeg-turbo** | JPEG codec | <https://github.com/libjpeg-turbo/libjpeg-turbo/security/advisories>, NVD `cpe:2.3:a:libjpeg-turbo:libjpeg-turbo` |
| **zlib** | DEFLATE compression | <https://github.com/madler/zlib/security/advisories>, NVD `cpe:2.3:a:zlib:zlib` |
| **abseil-cpp** | Common C++ utilities | <https://github.com/abseil/abseil-cpp/security/advisories> |
| **skia** (optional) | 2D rendering (only if bblanchon build enables it) | <https://skia.googlesource.com/skia/+log> |
| **V8** (optional) | JavaScript engine for embedded PDF JS | Chromium Security Notes |
| **HarfBuzz** | Complex-text shaping | <https://github.com/harfbuzz/harfbuzz/security/advisories> |

None of the "optional" ones are actually optional in `bblanchon/pdfium-binaries`'s
default builds — assume they are all shipping.

## Inspect what's actually shipped

Run this against a release APK to read the ground-truth version tags
embedded by the bblanchon build system directly into the `.so` binary:

```bash
# 1. Extract the APK and locate libpdfium.so for one ABI.
apktool d -f -o /tmp/rksk-decoded \
    android/app/build/outputs/apk/release/app-arm64-v8a-release.apk

PDFIUM_SO=/tmp/rksk-decoded/lib/arm64-v8a/libpdfium.so

# 2. Read the SHA-256 (this uniquely identifies the exact bblanchon build).
shasum -a 256 "$PDFIUM_SO"

# 3. Grep for the embedded Chromium branch tag. bblanchon builds label
#    themselves as e.g. "PDFium 138.0.7180.0" and include the
#    "chromium/7180" branch string.
strings -n 8 "$PDFIUM_SO" | grep -Ei 'chromium/[0-9]{4}|pdfium.*[0-9]+\.[0-9]+\.[0-9]+' | sort -u

# 4. Look for FreeType's compiled-in version constant.
#    (Not every FreeType build embeds this literally; if empty, use step 6.)
strings -n 4 "$PDFIUM_SO" | grep -E '^FreeType [0-9]+\.[0-9]+\.[0-9]+' | sort -u

# 5. Look for OpenJPEG's version constant.
strings -n 4 "$PDFIUM_SO" | grep -Ei 'openjpeg (v?[0-9]+\.[0-9]+\.[0-9]+|version)' | sort -u

# 6. Cross-reference the SHA-256 from step 2 against
#    https://github.com/bblanchon/pdfium-binaries/releases — every asset
#    there ships its own sha256 next to the download button. A match tells
#    you the exact release, and each release's release notes list which
#    FreeType/OpenJPEG/libpng/libjpeg-turbo/zlib were rolled that cycle.
```

Once you know the bblanchon release, click through to its release notes and
record the FreeType / OpenJPEG / libpng / libjpeg-turbo / zlib commit SHAs
listed under the "Roll third_party/…" changelog lines. Copy those into the
table below on every dependency bump.

### Current shipped versions (fill in on every release)

| Component | Version / branch | Source of truth | Last verified |
| --- | --- | --- | --- |
| `io.legere:pdfiumandroid` | 1.0.32 | Maven Central POM | 2025-02-08 (Maven publication date) |
| bblanchon/pdfium-binaries release | _run the inspection commands above and fill in_ | GitHub Releases page | TBD |
| PDFium (Chromium branch) | _from step 3 above, e.g. `chromium/6821`_ | pdfium.googlesource.com | TBD |
| FreeType | _from bblanchon release notes_ | freetype.org | TBD |
| OpenJPEG | _from bblanchon release notes_ | uclouvain/openjpeg | TBD |
| libpng | _from bblanchon release notes_ | libpng.org | TBD |
| libjpeg-turbo | _from bblanchon release notes_ | libjpeg-turbo.org | TBD |
| zlib | _from bblanchon release notes_ | zlib.net | TBD |

## CVE monitoring runbook

Every 30 days, or before every store release, whichever comes first:

1. Regenerate the machine-readable SBOM:

   ```bash
   cd android
   ./gradlew :cyclonedxBom
   # Produces android/build/reports/cyclonedx/bom.json and bom.xml
   # (aggregate SBOM covering :app + every autolinked native module)
   ```

2. Feed the SBOM to a CVE scanner. Any of the following works; pick one:

   ```bash
   # Option A: grype (fast, Anchore)
   grype sbom:android/build/reports/cyclonedx/bom.json

   # Option B: trivy
   trivy sbom android/build/reports/cyclonedx/bom.json

   # Option C: OWASP Dependency-Check (as a Gradle task, integrated)
   ./gradlew :app:dependencyCheckAnalyze
   ```

   Note: **these tools see the Maven layer only**. They will flag
   `io.legere:pdfiumandroid:1.0.32` if a CVE is registered against that
   Maven coordinate, but they cannot introspect FreeType / OpenJPEG
   versions inside `libpdfium.so`. That is why step 3 is separate.

3. Manually check the transitive-native CVE feeds for anything published
   since the last check date. The links in the "Dependency chain" section
   above are authoritative; also watch:

   - <https://chromereleases.googleblog.com/search/label/PDF> — Chromium
     security releases explicitly tagged as PDF fixes normally correspond
     to PDFium changes.
   - <https://nvd.nist.gov/vuln/search?query=pdfium> — every NVD entry
     lists which Chromium branches are affected; compare to the branch
     currently shipping in RKSK.

4. If any CVE with **CVSS ≥ 7.0** affects a currently-shipping component,
   file a P0 to bump to a pdfiumandroid version that pulls a newer
   bblanchon binary — see "Upgrade playbook" below.

## Upgrade playbook

`react-native-pdf@7.0.4` hard-codes `io.legere:pdfiumandroid:1.0.32` in its
own `android/build.gradle`, so we can't just change our `package.json` to
bump the native side. Three ways to force a newer version:

### Option 1 — Gradle resolutionStrategy (least invasive)

Add to `android/app/build.gradle`, inside `android { … }`:

```groovy
configurations.all {
    resolutionStrategy.eachDependency { details ->
        if (details.requested.group == 'io.legere'
                && details.requested.name == 'pdfiumandroid'
                && details.requested.version == '1.0.32') {
            details.useVersion '1.0.35'
            details.because 'F-10: pull newer bblanchon/pdfium-binaries build with rolled FreeType/OpenJPEG.'
        }
    }
}
```

Test rendering a variety of PDFs after this change; io.legere:pdfiumandroid
maintains a stable API within the 1.0.x line, but native code paths can
still regress. Do NOT skip the manual PDF-render test.

### Option 2 — patch-package the react-native-pdf build.gradle

The repo already uses `patch-package` (see `patches/`). Create a patch:

```bash
# Edit node_modules/react-native-pdf/android/build.gradle
#   change: implementation 'io.legere:pdfiumandroid:1.0.32'
#   to:     implementation 'io.legere:pdfiumandroid:1.0.35'
npx patch-package react-native-pdf
git add patches/react-native-pdf+7.0.4.patch
```

### Option 3 — jump to react-native-pdf 8.x when it lands

Watch <https://github.com/wonday/react-native-pdf/releases>. As of writing
the 7.x line is current; a future 8.x may bump to `io.legere:pdfiumandroid`
2.x (which requires wonday's API-side migration).

Whichever option you choose, re-run the entire "CVE monitoring runbook"
after upgrade and update the "Current shipped versions" table.

## Automated SBOM (already wired)

The root `android/build.gradle` now applies
[`org.cyclonedx.bom`](https://github.com/CycloneDX/cyclonedx-gradle-plugin)
version 3.3.0, which emits a CycloneDX 1.6 JSON + XML SBOM of every Maven
coordinate the release variant assembles across `:app` and every autolinked
React Native native module. Two tasks are exposed:

| Task | Scope | Output |
| --- | --- | --- |
| `./gradlew :cyclonedxBom` | **Aggregate SBOM** — all subprojects in one document. Use this for compliance / attestation. | `android/build/reports/cyclonedx/bom.{json,xml}` |
| `./gradlew :app:cyclonedxDirectBom` | Per-module SBOM (just `:app`). Useful when iterating on filters. | `android/app/build/reports/cyclonedx-direct/bom.{json,xml}` |

Configuration filters `cyclonedxDirectBom` to `releaseRuntimeClasspath` in
every subproject so debug-only and test-only coordinates don't leak in. The
`schemaVersion` defaults to CycloneDX v1.6.

Attach the aggregate `bom.json` to every store release / Play Console upload
for audit compliance. On CI, upload it as a signed build artifact so future
auditors can request "what did version 1.0.13 actually ship?" and get an
authoritative answer.

**Note:** the SBOM is NOT auto-hooked into `assembleRelease` today. To wire
that up when you're ready:

```groovy
// android/app/build.gradle, inside android { ... }
afterEvaluate {
    tasks.matching { it.name in ['assembleRelease', 'bundleRelease'] }
        .configureEach { it.finalizedBy(rootProject.tasks.named('cyclonedxBom')) }
}
```

Not enabled by default because it lengthens every release build by ~20 s;
run it explicitly before shipping instead.

## Future improvement: Gradle dependency locking

Gradle can pin every transitive Maven version to an exact resolved
coordinate and store the result as a `gradle.lockfile`, making builds
byte-for-byte reproducible and forcing every version bump to be a
reviewable diff. The obvious place to enable this is in
`android/app/build.gradle`:

```groovy
dependencyLocking {
    lockAllConfigurations()
    // start LENIENT while shaking out version drift, tighten to STRICT later
    // lockMode = LockMode.STRICT
}
```

It is deliberately NOT enabled today because the React Native Gradle
Plugin performs some dynamic version resolution during autolinking and a
handful of RN libraries declare floating `+` versions (e.g.
`com.facebook.react:react-native:+` inside `react-native-pdf`). Turning on
`lockAllConfigurations()` before the RN autolinking side has been
stabilised will fail the build with confusing "resolved version does not
match locked version" errors on every RN dependency bump.

Enable it after the next full RN dependency audit / upgrade cycle. In the
meantime, the CycloneDX SBOM captures the exact resolved versions per
build and gives us the same forensic answer, just after the fact rather
than as a build-time gate.

## Long-term advisory: reduce the pdfium blast radius

pdfium's attack surface is large (~500k LOC of C/C++ handling untrusted
PDF input, XFA, embedded JS, image codecs). Every CVE in any of the
statically-linked libs above becomes an RKSK CVE. Two structural
alternatives are worth evaluating over the next release cycle:

1. **Use the Android system PDF renderer.**
   `android.graphics.pdf.PdfRenderer` has been in the platform since
   API 21 and is updated **by Google via monthly system updates**, not
   by us. It has a simpler API but covers most view-only use-cases.
   If RKSK only needs to *display* PDFs (no annotations, no form
   filling), this eliminates the entire third-party pdfium chain and
   its supply-chain problem. Drawbacks: no JS/XFA support, no text
   selection APIs, page rendering is bitmap-only.

2. **Render inside a WebView using `pdf.js`.**
   Mozilla's [`pdf.js`](https://mozilla.github.io/pdf.js/) runs in the
   WebView sandbox, so a malicious PDF cannot exploit native code paths
   — it can at worst crash JavaScript inside a process the WebView
   already isolates. This trades native performance for sandboxing.

3. **Server-side render to images.**
   If the backend already has ImageMagick / Ghostscript pinned, it can
   convert PDFs to per-page PNG/JPEG and the mobile app displays plain
   images. Zero mobile-side PDF parsing = zero mobile-side PDF CVEs.

Track this as a design item; do not treat any of the three as a drop-in
"fix" without measuring PDF-viewing UX against the current implementation.
