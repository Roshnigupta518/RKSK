# RKSK Android Release Signing

This document explains how to sign release builds for the RKSK Android app in a
way that satisfies the L1 audit finding **F-07 — Personal signing key + no V3
+ dev path leak**. Read the whole document before your first release build.

## What the audit flagged

| Sub-finding | Concrete evidence | Impact |
| --- | --- | --- |
| Personal signing key | `new-upload-key.keystore` cert is issued to `CN=Roshni Gupta, OU=Alex Social, O=Alex, L=Bhopal, ST=IN, C=In` — an individual developer, not the organisation | If the developer leaves or is compromised, they can silently sign malicious updates that Android will accept as legitimate upgrades. Every APK also publishes the developer's name in its signing block. |
| Plaintext keystore creds in VCS | `android/gradle.properties` used to contain `MYAPP_UPLOAD_STORE_PASSWORD=123456` and `MYAPP_UPLOAD_KEY_PASSWORD=123456`, both `git`-tracked | Anyone with repo history access can sign malicious APKs indistinguishable from official releases. |
| No explicit v3/v4 signing | `signingConfigs.release` had no `enableV*Signing` flags, so AGP fell back to defaults that still include v1 (JAR) signing | v1 is vulnerable to the Janus attack (CVE-2017-13156). v3 (key rotation) and v4 (incremental install) were not being emitted. |
| Silent misconfiguration | `buildTypes.release` used to assign `signingConfig signingConfigs.debug` before `signingConfigs.release`, and did nothing when `MYAPP_UPLOAD_STORE_FILE` was absent | A release build could ship debug-signed or unsigned by accident. |

## What has already been fixed in code

1. **`android/gradle.properties`** — plaintext `123456` passwords removed. The
   file now contains only non-secret build flags and a comment pointing devs
   at `~/.gradle/gradle.properties`.
2. **`android/app/build.gradle`** — `signingConfigs.release` now sets
   `enableV1Signing = false`, `enableV2Signing = true`, `enableV3Signing =
   true`, `enableV4Signing = true`. The `buildTypes.release` block throws
   `GradleException` if `MYAPP_UPLOAD_STORE_FILE` is not provided, so a
   release build can no longer be produced with the debug key by accident.
3. **`android/gradle.properties.example`** — a template that devs can copy
   into `~/.gradle/gradle.properties`.

## What still needs to happen operationally

### 1. Treat the existing key as compromised — rotate it

The old passwords (`123456`) were committed to git. Anyone with a clone of
the repo history has them. This means:

- **Every APK signed with the current `new-upload-key.keystore` is signed
  with a compromised key.** Rotate as soon as feasible.
- The recommended path is to enrol the app in **Google Play App Signing**,
  which lets Play manage the app signing key while you keep control of only
  the upload key. Rotation is then a straightforward `PEM upload → old key
  revoked` operation via the Play Console. See
  <https://support.google.com/googleplay/android-developer/answer/9842756>.
- If Play App Signing is not an option (e.g. sideloaded APKs), see the
  APK Signature Scheme v3 key-rotation flow:
  <https://source.android.com/security/apksigning/v3>.

### 2. Generate an organisation-owned upload keystore

Do this on a hardened workstation, not on a shared laptop. Store the
resulting `.keystore` file **outside the repo** (e.g. `~/keys/`, or a
hardware-backed keystore / HSM / KMS envelope).

```bash
keytool -genkeypair -v \
  -keystore ~/keys/rksk-upload.keystore \
  -alias upload \
  -keyalg RSA -keysize 4096 \
  -sigalg SHA256withRSA \
  -validity 10000 \
  -storetype PKCS12 \
  -dname "CN=RKSK Mobile App, OU=National Health Mission, O=NHM, L=<city>, ST=<state>, C=IN"
```

Guidelines:

- Use an **organisational identity** in the DN, never a person's name.
  `CN` should identify the app; `O` should identify the organisation
  (`NHM` in this project).
- 4096-bit RSA + SHA256withRSA is the current sweet spot. ECDSA-P-256 is
  also acceptable if your CI/CD tooling supports it.
- 10 000-day validity (~27 years) matches Play Console's minimum for new
  uploads.
- Passwords: minimum 16 characters, from a password manager, unique.
- **PKCS12 caveat**: pass the SAME value to `-storepass` and `-keypass`.
  The PKCS12 format (`-storetype PKCS12`, which is the modern default and
  what this project uses) only supports one password for both the store
  and each key entry. If you supply two different values, `keytool`
  silently discards `-keypass` and uses `-storepass` for both, but the
  warning it prints scrolls past quickly. If you later set the two Gradle
  properties `MYAPP_UPLOAD_STORE_PASSWORD` and `MYAPP_UPLOAD_KEY_PASSWORD`
  to different strings, the signing task will fail at `:app:packageRelease`
  with `Get Key failed: Given final block not properly padded`.

### 3. Configure the keystore locally

Create (or edit) `~/.gradle/gradle.properties` and add:

```properties
MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/rksk-upload.keystore
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=<strong password>
MYAPP_UPLOAD_KEY_PASSWORD=<strong password>
```

`~/.gradle/gradle.properties` is per-user and not in the repo, so nothing
here leaks into VCS.

### 4. Configure the keystore on CI

Expose the same four values as environment variables prefixed with
`ORG_GRADLE_PROJECT_`. Gradle automatically translates
`ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_PASSWORD` → the Gradle property
`MYAPP_UPLOAD_STORE_PASSWORD`. The keystore file itself should be either
(a) decrypted from a secret manager (AWS/GCP Secret Manager, Vault, GitHub
Actions encrypted secret) into a temp path just before the release task,
or (b) held in a signed sealed artifact your build runner opens.

Example (GitHub Actions):

```yaml
- name: Decode upload keystore
  run: |
    echo "${{ secrets.RKSK_UPLOAD_KEYSTORE_B64 }}" | base64 -d > "${RUNNER_TEMP}/rksk-upload.keystore"
    echo "ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_FILE=${RUNNER_TEMP}/rksk-upload.keystore" >> "$GITHUB_ENV"

- name: Assemble release
  env:
    ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_ALIAS: upload
    ORG_GRADLE_PROJECT_MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.RKSK_UPLOAD_STORE_PASSWORD }}
    ORG_GRADLE_PROJECT_MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.RKSK_UPLOAD_KEY_PASSWORD }}
  run: ./gradlew :app:assembleRelease
```

### 5. Verify the produced APK/AAB

After a release build, use `apksigner` (from the Android SDK) to confirm
the signature schemes are what we expect:

```bash
$ANDROID_HOME/build-tools/<version>/apksigner verify --verbose --print-certs \
    android/app/build/outputs/apk/release/app-release.apk
```

Expected output (paraphrased):

```
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Verified using v4 scheme (APK Signature Scheme v4): true
Signer #1 certificate DN: CN=RKSK Mobile App, OU=..., O=NHM, ...
```

If `v1: true` still shows up, or the DN still says a personal name, the
migration is incomplete.

### 6. Purge the old passwords from git history (optional but recommended)

Even after rotating the keystore, the string `123456` and the old
`.keystore` path linger in history and will be findable by anyone with a
clone. If your repository access is not tightly controlled, consider a
history rewrite (`git filter-repo` / BFG) followed by a force-push and a
credential rotation. Coordinate with everyone who has cloned the repo,
since a rewrite invalidates their local history.
