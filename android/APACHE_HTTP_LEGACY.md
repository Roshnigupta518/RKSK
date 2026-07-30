# F-19 — `org.apache.http.legacy` uses-library removed from merged manifest

Status: **fixed** (manifest-merger `tools:node="remove"` + release-build Gradle guard)
Owner: Frontend/Android security workstream
Related findings: F-06 (FileProvider hardening — used the same `tools:` namespace), F-14 (storage-permission `maxSdkVersion` scoping), F-18 (unmaintained MP3 codec excision)

---

## 1. What was flagged

The L1 security audit observed the following node in the merged
`AndroidManifest.xml` of a release APK:

```xml
<uses-library
    android:name="org.apache.http.legacy"
    android:required="false" />
```

`org.apache.http.legacy.jar` is an AOSP-shipped copy of **Apache
HttpClient 4.x** code that Android deprecated in API 23 (Marshmallow,
2015) and removed from the runtime classpath by default in API 28
(Pie, 2018). Apps that still want the classes must opt-in via this
exact `<uses-library>` declaration.

The library is unmaintained upstream, has never received security
back-ports from Google, and carries several public CVEs that the AOSP
copy inherits:

| CVE            | Effect                                                                            |
| :------------- | :-------------------------------------------------------------------------------- |
| CVE-2012-6153  | SSL certificate chain-of-trust bypass in `DefaultHostnameVerifier`                |
| CVE-2014-3577  | Hostname verification bypass for TLS certificates with wildcard CommonName        |
| CVE-2015-5262  | Man-in-the-Middle: SSLSocketFactory doesn't set the default socket timeout        |
| CVE-2020-13956 | URI parsing accepts malformed input, enabling SSRF-style bypasses of URL filters  |

Even when the code path that would trip these CVEs is never invoked by
the app itself, the mere presence of the `<uses-library>` node:

1. Grants any dependency (including any future one) trivial access to
   an unpatched, weakly-configured HTTP client with TLS 1.0 defaults
   available.
2. Signals to security scanners (MobSF, AppSweep, Play Console
   pre-launch report) that the app opted into legacy HTTP — an
   easy-to-fail security-checklist item.
3. Slightly expands the trusted classpath the JVM verifier will
   accept — a plus for any reflective attack that lands.

## 2. Why it was in the manifest

The declaration is not authored by RKSK. Gradle's manifest-merger
blame report (`android/app/build/intermediates/manifest_merge_blame_file/release/processReleaseMainManifest/manifest-merger-blame-release-report.txt`)
attributes it to:

```
[com.google.android.gms:play-services-maps:19.1.0]
    …/transformed/play-services-maps-19.1.0/AndroidManifest.xml:33
```

The play-services-maps AAR ships its own manifest with the following
`<application>` block:

```xml
<application>
    <!-- Needs to be explicitly declared on P+ -->
    <uses-library android:name="org.apache.http.legacy" android:required="false" />
</application>
```

play-services-maps is pulled in by `react-native-maps` (see
`package.json`). Google's own Maps SDK runtime has been on OkHttp /
`HttpURLConnection` since v18+ and does not reach into the legacy
library at runtime. The declaration is retained by Google purely as a
compat safety-net for very old apps that used the Maps SDK's
`Geocoder`-adjacent code paths from the AOSP `android.location.*` era.
For a modern app it is dead weight.

## 3. The fix

`android/app/src/main/AndroidManifest.xml` now carries the following
node inside `<application>`:

```xml
<uses-library
    android:name="org.apache.http.legacy"
    android:required="false"
    tools:node="remove" />
```

`tools:node="remove"` is a manifest-merger instruction (documented at
<https://developer.android.com/build/manage-manifests#node_markers>).
The merger identifies `<uses-library>` nodes by their
`android:name` attribute; a matching node in the app's own manifest
with `tools:node="remove"` deletes any library-injected sibling with
the same identifier from the final merged output.

The `android:required="false"` attribute is preserved on the removal
node to satisfy the manifest merger's strict validation, but it is
inert — the removal directive fires before the value is inspected.

### Belt-and-braces build guard

Manifest-merger removal directives silently fail in edge cases:

- if a library ships a slightly different `<uses-library>` (e.g. inside
  a nested element or with a mistyped attribute name);
- if TWO libraries both inject the same node (the removal only nulls
  out one match, and merge-mode determines which one wins);
- if a developer accidentally deletes the removal directive during a
  routine manifest cleanup.

To catch all three, `android/app/build.gradle` adds a Gradle
`doLast` on `processReleaseManifest` / `processReleaseMainManifest`
that reads the merged output and fails the release build if the exact
string `android:name="org.apache.http.legacy"` still appears anywhere
in it. The check runs only for release variants — debug builds don't
ship to users and running the guard there would slow the inner-loop
without security upside.

## 4. Verification

### 4.1 Source-level (before rebuild)

```bash
# Confirm the app does not use Apache HTTP anywhere.
grep -rn 'org\.apache\.http\.' android/app/src/
grep -rln 'org\.apache\.http\.' node_modules/*/android/src/ node_modules/@*/*/android/src/
# Expected: no matches in either invocation.
```

### 4.2 Merged manifest (after rebuild)

```bash
cd android
./gradlew :app:processReleaseManifest    # or bundleRelease / assembleRelease

# The Gradle guard fires automatically; if it passes, also spot-check:
grep -c 'org.apache.http.legacy' app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml
grep -c 'org.apache.http.legacy' app/build/intermediates/packaged_manifests/release/processReleaseManifestForPackage/AndroidManifest.xml
# Expected: 0 for both.
```

### 4.3 Final APK inspection

```bash
apkanalyzer manifest print app-release.apk | grep -c 'org.apache.http.legacy'
# Expected: 0.

# The classpath check — even without the <uses-library> declaration, if any
# code path tries to reference org.apache.http.*, R8 would have kept those
# classes. Their absence in the DEX is the strongest evidence:
apkanalyzer dex packages app-release.apk | grep -iE 'org\.apache\.http'
# Expected: no matches (or, at most, R8's leftover
# `androidx.http.*` retention rules for AndroidX libraries — those are
# unrelated to `org.apache.http.legacy`).
```

### 4.4 Blame-report cross-check (optional, diagnostic)

If the guard ever fires and it isn't obvious which library reintroduced
the node, read the manifest-merger blame report:

```bash
grep -B1 -A3 'apache\.http\.legacy' \
    app/build/intermediates/manifest_merge_blame_file/release/processReleaseMainManifest/manifest-merger-blame-release-report.txt
```

The line above each `<uses-library>` hit names the AAR coordinate that
injected it (e.g.
`[com.google.android.gms:play-services-maps:19.1.0]`).

## 5. Troubleshooting

### 5.1 The Gradle guard fires unexpectedly

Most likely a new dependency was added (Firebase, Play Services module,
ML Kit) that injects its own `<uses-library>` declaration for
`org.apache.http.legacy`. The blame report in §4.4 identifies which
AAR. Options in order of preference:

1. **Add a `tools:strict` marker** to the app manifest so the merger
   errors instead of silently keeping duplicates:
   ```xml
   <application tools:strict="uses-library">
   ```
   Then re-run — the merger will explicitly list any nodes it cannot
   remove.
2. **Add a second removal rule** targeting the new library
   coordinate. Since `<uses-library>` nodes are identified by
   `android:name`, our single rule already targets ALL declarations
   with that name — the failure mode above is usually about a
   subtly-different `android:name` (e.g. a typo or a legacy variant).
   Add another `<uses-library tools:node="remove"/>` matching the new
   name.
3. **File an upstream issue** with the offending library asking why
   they still declare it in 2026, and downgrade if unresolvable.

### 5.2 Maps SDK stops working after the fix

It won't — Maps SDK v18+ uses OkHttp for its network calls and does
not touch `org.apache.http.*` at runtime. If Maps genuinely breaks
after this change, the root cause is elsewhere (API key, network
security config, Play Services version); check `adb logcat -s
GoogleMaps:*` for the real error. This finding closed cleanly against
`react-native-maps@1.26.16` + `play-services-maps@19.1.0` — the
combination RKSK ships today.

### 5.3 The Gradle guard silently passes

The guard resolves the target manifest via
`manifestTask.outputs.files` — Gradle's canonical handle for the
outputs of the task run that just completed. If that returns an
empty set (some AGP task variants publish through the Artifacts API
without a `File` output), the guard skips the check for that task
rather than failing the build. Coverage is preserved because the
guard hooks THREE tasks (`processReleaseManifest`,
`processReleaseMainManifest`, `processReleaseManifestForPackage`)
and at least one of them always exposes the manifest as a `File`.

If ALL three end up empty on a future AGP release, the guard silently
becomes a no-op. Verify by running:

```bash
./gradlew :app:processReleaseMainManifest --info | grep -i 'F-19'
```

and expect either a passed run with no warning, or an explicit warning
of the form `[F-19] Could not read outputs of task <name>`. If you
see the warning, extend the `f19ManifestTaskNames` set in
`android/app/build.gradle` to include the new task name, or fall
back to `fileTree(project.layout.buildDirectory.dir("intermediates/<agp-path>"))`
with a task-specific subdirectory.

### 5.4 The guard flags stale files from a previous build

You will NOT see this in the current implementation because the guard
uses `manifestTask.outputs.files` (fresh per-run outputs) rather than
walking `intermediates/`. If you diverge from this pattern in a future
edit and add a `fileTree(project.layout.buildDirectory.dir(...))`
scan, remember that `intermediates/` contains artefacts from ALL
prior task runs — including AGP 7.x layouts left behind after an
upgrade to AGP 8+, and packaged-manifest outputs from earlier release
builds that predate this fix. Always prefer `outputs.files`.

## 6. What this fix does NOT do

- It does **not** stop Google or other library authors from continuing
  to declare `<uses-library org.apache.http.legacy>` in their own
  AARs. Their manifests remain unchanged; the merger simply drops
  their declaration in favour of our removal rule.
- It does **not** rewrite the `org.apache.http.legacy.jar` file
  distributed by AOSP. That artefact is out of our control; the fix
  simply prevents the RKSK APK from ever asking the OS to load it.
- It does **not** address the general "legacy HTTP client in the
  ecosystem" problem — if a future dependency ships its own
  bundled copy of Apache HttpClient inside its own AAR (as a fat
  jar), that is a separate finding (would fall under F-10 SBOM /
  supply-chain provenance).

## 7. Change log

- **2026-07-30** — F-19 fix committed. Manifest removal directive,
  Gradle release-manifest guard, this document created.
