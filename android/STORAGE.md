# Storage permissions & scoped-storage strategy (F-14)

> **Audit finding F-14** — `WRITE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE`
> declared without `android:maxSdkVersion`, so the app requests broad
> shared-storage rights on API 21-28 devices (`WRITE_EXTERNAL_STORAGE` on
> pre-Q gave write access to the entire `/sdcard/*` tree) and continues to
> surface a "modify or delete storage" grant on modern devices where the
> permission is a no-op.

This document is the source of truth for how RKSK deals with shared /
external storage on Android. Read this before adding any file I/O code
or any new native library that touches storage.

---

## 1. What the app actually does with storage

| Code path | Files written | Permission required today |
| --- | --- | --- |
| `src/utils/helper.js` → `initiateDownload` | Downloaded PDFs into public `Downloads/` via `ReactNativeBlobUtil` with `useDownloadManager: true` | **None** on API 29+ (DownloadManager handles the write). `WRITE_EXTERNAL_STORAGE` on API 21-28. |
| `src/components/compressMedia/index.js` | Compressed image / video via `react-native-image-picker` + library-managed tempfiles | None — targets app-private cache. |
| `src/HOC/ImageUploader.js` | Camera capture / gallery pick via `react-native-image-picker` | `CAMERA` (declared). On API 33+ gallery reads use the Photo Picker / ACTION_GET_CONTENT, both permission-free. `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` are still requested defensively by `src/route/index.js`. |
| `react-native-webview` file uploads | App-private `getExternalFilesDir()` (see F-06 `rksk_webview_file_paths.xml`) | None. |
| `react-native-pdf` viewer | Reads files from a URI or the app-private download path | None. |

The app **never** writes user-visible files anywhere except public
`Downloads/`, and that write is delegated to Android's system
`DownloadManager` service. This is important — see §3 below.

---

## 2. The declared permission surface after F-14

`android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Scoped to legacy API levels only -->
<uses-permission
    android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28"
    tools:replace="android:maxSdkVersion" />
<uses-permission
    android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32"
    tools:replace="android:maxSdkVersion" />

<!-- Modern per-media read permissions (API 33+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

### 2.1 Why the `maxSdkVersion` bounds

| API bracket | `WRITE_EXTERNAL_STORAGE` | `READ_EXTERNAL_STORAGE` | Enforced by |
| --- | --- | --- | --- |
| ≤ 18 (< Kitkat) | required to write `/sdcard/*` | required to read `/sdcard/*` | Legacy — we don't ship for these anyway (min SDK is higher). |
| 19-28 (Kitkat–Pie) | **effective**, grants ENTIRE `/sdcard/*` | **effective**, grants ENTIRE `/sdcard/*` | Our declaration keeps them. |
| 29-30 (Q, R) | ignored for user-visible dirs (scoped storage); still declared for legacy blob-util call sites | effective | `maxSdkVersion="28"` drops WRITE here. READ still needed. |
| 31-32 (S, S_V2) | ignored | effective for gallery reads | READ declared up to 32. |
| **33+ (Tiramisu)** | ignored | **superseded** by `READ_MEDIA_*` | `maxSdkVersion="32"` drops READ. `READ_MEDIA_*` take over. |

So the merged `uses-permission` set on a Pixel running Android 14 is
`READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, plus the location / camera /
foreground-service perms — **no** `WRITE_EXTERNAL_STORAGE`, no
`READ_EXTERNAL_STORAGE`. This is what shows up in the Play Store
listing and in the OS runtime permission dialog.

### 2.2 Why `tools:replace="android:maxSdkVersion"` is mandatory

Two React Native libraries drag in the same permissions **un-bounded**:

```
node_modules/react-native-blob-util/android/src/main/AndroidManifest.xml
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
node_modules/react-native-fs/android/src/main/AndroidManifest.xml
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

The Android Gradle Plugin's manifest merger, in the absence of an
explicit conflict marker, would keep the library declaration (no
`maxSdkVersion` → applies to all API levels) and silently drop our
bound. That would mean **the F-14 fix does nothing at runtime** — the
merged manifest would still declare unbounded storage rights.

`tools:replace="android:maxSdkVersion"` forces the manifest merger to
take the value from the app manifest even when the library manifest
does not have that attribute. Reference:
<https://developer.android.com/build/manage-manifests#markers>

### 2.3 Why `READ_MEDIA_AUDIO` is intentionally NOT declared

`READ_MEDIA_AUDIO` (API 33+) grants read access to the on-device audio
library. RKSK has **no** audio-picking or audio-processing code path
today (verified: no `mimeType: audio/*`, no `ACTION_PICK` for audio,
no `react-native-audio-*` module). Declaring the permission would
enlarge the grant surface without justification and would need a
Play Store data-safety disclosure. Do not add it without an actual
audio use case.

---

## 3. How downloads work on modern Android without `WRITE_EXTERNAL_STORAGE`

`src/utils/helper.js` builds a `ReactNativeBlobUtil` request like:

```js
const options = {
    fileCache: true,
    addAndroidDownloads: {
        useDownloadManager: true,     // key line
        notification: true,
        mediaScannable: true,
        title, mime: 'application/pdf', appendExt: 'pdf', description: title,
        path: `/storage/emulated/0/Download/${fileName}`,
    },
};
await ReactNativeBlobUtil.config(options).fetch('GET', url);
```

`useDownloadManager: true` routes the HTTP fetch through Android's
`android.app.DownloadManager` system service. That service:

1. Has its own permissions (holds `WRITE_EXTERNAL_STORAGE`
   internally, or on API 29+ writes via MediaStore under its own
   privileges).
2. Persists the file into public `Downloads/` regardless of whether
   the calling app holds `WRITE_EXTERNAL_STORAGE`, on API 29+.
3. Emits the standard download notification and mediastore scan,
   giving the user visibility and control.

That's why bounding `WRITE_EXTERNAL_STORAGE` to `maxSdkVersion="28"`
does not regress downloads on Android 10 / 11 / 12 / 13 / 14 devices.

### 3.1 Known gap (not fixed by F-14): permission branch in helper.js

`src/utils/helper.js` currently branches on `androidVersion >= 13`
where the intent was clearly "Android 13+" (API 33+). Because
`Platform.Version` returns the **API level integer**, `>= 13` is true
for API 13 (Android 3.2, 2011) and above — i.e. every real device.
The consequence is that `requestStoragePermission()` (which asks for
`WRITE_EXTERNAL_STORAGE` at runtime) is effectively dead code today
and never runs.

That is coincidentally the correct outcome for API 29+ (no runtime
grant needed for DownloadManager writes), so F-14 does not need to
touch it. When the JS-side condition is eventually fixed to
`>= 29`, no manifest change is required.

Follow-up task tracked separately as a code-quality item, not a
security item.

---

## 4. Runtime request flow (unchanged, cross-referenced)

The runtime `PermissionsAndroid.requestMultiple` call in
`src/route/index.js` already branches correctly on API level:

```js
Platform.Version >= 33
  ? [ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION,
     READ_EXTERNAL_STORAGE,   // OS auto-ignores on 33+, harmless
     READ_MEDIA_IMAGES,       // NEW: now backed by manifest declaration
     READ_MEDIA_VIDEO,        // NEW: now backed by manifest declaration
     CAMERA]
  : [ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION,
     CAMERA,
     READ_EXTERNAL_STORAGE]   // backed by manifest, scoped to <=32
```

Before F-14 the API 33+ branch would call
`PermissionsAndroid.request(READ_MEDIA_IMAGES)` and get an immediate
`never_ask_again` from the OS, because the manifest did not declare
that permission. After F-14 the request now surfaces the standard
Android grant dialog.

Do not reintroduce `WRITE_EXTERNAL_STORAGE` into this runtime request
list — even on API 21-28, the DownloadManager path does not need it
from the calling app.

---

## 5. Checklist for adding new storage code

Before shipping any new native module or JS code path that touches
files, verify:

1. Does the path live inside `getExternalFilesDir()` /
   `getCacheDir()` / `getFilesDir()`? If yes, **no permission**
   needed on any API level. Prefer this.
2. Does the path live inside public `Downloads` / `Pictures` /
   `Movies` / `DCIM`? On API 29+, prefer `MediaStore` inserts or
   `DownloadManager`. On API 21-28, require
   `WRITE_EXTERNAL_STORAGE` at runtime.
3. Are you selecting media from the user's gallery? Prefer
   `ACTION_PICK_IMAGES` (Photo Picker, API 33+ backported via
   Play services) or `ACTION_GET_CONTENT`, both permission-free.
   If a real gallery scan is required, ask for `READ_MEDIA_IMAGES` /
   `READ_MEDIA_VIDEO` (API 33+) or `READ_EXTERNAL_STORAGE`
   (API ≤ 32). Both are already declared.
4. Do NOT request `MANAGE_EXTERNAL_STORAGE`. This is an "all files"
   super-permission gated by a Play Store manual review and denied
   by default; RKSK has no valid use case for it.
5. Do NOT set `android:requestLegacyExternalStorage="true"` on the
   `<application>` tag. It is a temporary opt-out for API 29-30 only,
   is ignored on API 30+, and undermines the scoped-storage posture.
6. If you add a new native library, check its
   `node_modules/<library>/android/src/main/AndroidManifest.xml` for
   any `<uses-permission>` it drags in. If it declares
   `WRITE_EXTERNAL_STORAGE` or `READ_EXTERNAL_STORAGE` un-bounded,
   confirm the app-level `tools:replace` still wins the merge (run
   `./gradlew :app:processDebugManifest` and inspect the output at
   `android/app/build/intermediates/merged_manifests/debug/AndroidManifest.xml`).

---

## 6. How to verify the fix

### 6.1 Static — merged manifest

```bash
cd android
./gradlew :app:processDebugManifest
# The merged output is a machine-generated XML file. Look for the
# resolved <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"> lines:
grep -A1 'WRITE_EXTERNAL_STORAGE\|READ_EXTERNAL_STORAGE\|READ_MEDIA_' \
    app/build/intermediates/merged_manifests/debug/AndroidManifest.xml
```

Expected:

```
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                 android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
                 android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

If the `maxSdkVersion` attributes are missing, the `tools:replace`
marker did not fire — check that the `xmlns:tools` attribute is
declared on the `<manifest>` root element (it is).

### 6.2 Static — manifest-merger blame

```bash
cd android
./gradlew :app:processReleaseManifest
cat app/build/outputs/logs/manifest-merger-release-report.txt \
    | grep -A5 -E 'WRITE_EXTERNAL_STORAGE|READ_EXTERNAL_STORAGE|READ_MEDIA_'
```

The report shows every source that contributed a declaration. Expect
to see `react-native-blob-util` and `react-native-fs` listed as
overridden by the app manifest.

### 6.3 Runtime — inspect installed APK

```bash
# From an emulator / device with the debug build installed:
adb shell dumpsys package com.rkskmp | grep -i "permission\."
```

Expect no `WRITE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE` in the
runtime granted list on API 33+.

Alternatively, from the app APK:

```bash
$ANDROID_HOME/build-tools/34.0.0/aapt2 dump permissions \
    android/app/build/outputs/apk/release/app-release.apk
```

### 6.4 Play Console pre-launch report

After uploading a build, open **Play Console → App content → App access**
and confirm the "Sensitive permissions" section no longer lists
`WRITE_EXTERNAL_STORAGE` for Android 11+ devices.

---

## 7. Follow-ups

- **Code-quality — helper.js version check**: fix
  `androidVersion >= 13` → `androidVersion >= 29` in
  `requestStoragePermission()` (see §3.1). Not a security bug; F-14
  intentionally leaves it alone for minimum blast radius.
- **Photo Picker migration**: `react-native-image-picker` >= 7 supports
  the Android Photo Picker via `usePhotoPicker: true`. Migrating opens
  the door to dropping `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`
  entirely (Photo Picker requires no permission grant), further
  shrinking the manifest surface. Track under the next
  dependency-refresh sprint.
- **MediaStore for downloads**: if we ever move off
  `useDownloadManager: true`, the replacement should insert into
  `MediaStore.Downloads` rather than write to
  `/storage/emulated/0/Download/` directly. Direct paths break on
  API 29+ without `requestLegacyExternalStorage`, which we explicitly
  refuse to set (see §5).
