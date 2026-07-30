# Dependency & version pin policy (F-16)

> **Audit finding F-16** — `react-native` is pinned to the exact point
> release `0.81.4`. Without an accompanying process to notice patch
> releases (`0.81.5`, `0.81.6`, …), any CVE landed upstream stays
> unfixed in the shipped app indefinitely. The audit finding is not
> "unpin RN" (which would break more than it fixes — see §1); it is
> "make the pin auditable and actionable."

This document is the source of truth for how RKSK pins JS dependencies,
how the RN family stays aligned, when to bump versions, and how to run
supply-chain audits. Read this before touching `package.json` or
before merging a Dependabot PR against an `@react-native/*` entry.

Related documents:
- `android/SUPPLY_CHAIN.md` (F-10) — native library provenance.
- `android/NATIVE_MODULES.md` (F-12) — package denylist and native
  module review checklist.
- `.github/dependabot.yml` — automated update PR configuration.

---

## 1. Why `react-native` is pinned exactly (and stays that way)

RN is not a normal npm library. Its runtime binary (Hermes / JSC), its
Gradle plugin, its codegen, its babel preset, its metro config, its
CLI, and its Kotlin `MainActivity` template are all versioned as a
single unit. Mixing versions from different RN releases produces
symptoms like:

- Metro bundles referencing symbols the native runtime hasn't exposed
  yet ⇒ `undefined is not a function` at random JS call sites.
- Codegen emitting turbo-module specs against an older schema ⇒
  runtime crash inside the fabric renderer.
- Gradle plugin looking for build outputs at paths the RN version
  doesn't produce ⇒ `configureCMake*` failures with no useful trace.

For that reason the RN team's release template
(`npx react-native init`) generates `package.json` with an EXACT pin,
and the `upgrade-helper.expo.dev` tool produces manifests that require
EVERY `@react-native/*` peer to bump in lockstep.

**Policy: `react-native` and every `@react-native/*` peer are pinned
exactly, and move together in a single commit.**

The `postinstall` gate in `scripts/security-denylist.js` (F-16 half)
verifies this alignment on every install and fails the install if
drift is detected.

### 1.1 Exact-pin ≠ frozen-pin

The exact pin is authoritative for what's IN the repo. It is NOT a
statement that we intend to stay on 0.81.4 forever. `.github/dependabot.yml`
proposes new versions as they drop; a human reviews and merges. The
"exact pin" is the STARTING STATE of the review, not the END STATE.

---

## 2. The RN family — what stays aligned with `react-native`

The following packages MUST share the same version string as
`react-native` at all times, enforced by `scripts/security-denylist.js`:

| Package | Purpose | Why aligned |
| --- | --- | --- |
| `@react-native/babel-preset` | Babel preset for RN JS → JS | Emits transforms the runtime version must recognise |
| `@react-native/metro-config` | Default Metro config | Bundle format / require ID scheme is RN-version-specific |
| `@react-native/typescript-config` | tsconfig extends | Ships `types` that reference RN internals |
| `@react-native/eslint-config` | Lint rules | Uses RN-version-specific plugin APIs |
| `@react-native/new-app-screen` | Sample screen | Aligned by convention (safe to skip if unused) |

The following are RELATED but INDEPENDENTLY versioned — they follow their
own semver track, and Dependabot groups them so they still move together
even though the version strings don't match RN's:

| Package | Purpose |
| --- | --- |
| `@react-native-community/cli` | The `react-native` CLI shell |
| `@react-native-community/cli-platform-android` | Android-side of the CLI |
| `@react-native-community/cli-platform-ios` | iOS-side of the CLI |

The three `cli-*` packages MUST share a version string with each
other, or the platform sub-packages call into an API surface the top
level doesn't expose (which is exactly the F-16 drift we fixed by
aligning `cli-platform-android` from `20.0.0` to `^20.1.2`).

---

## 3. Upgrade playbook

### 3.1 Patch upgrades (0.81.4 → 0.81.5)

Cadence: **as-they-drop** (usually within a week of the Dependabot PR).
Risk: low — RN patches are bug fixes only, no API changes.

Recipe:

```bash
# Dependabot has opened PR "deps(react-native-core): bump react-native from 0.81.4 to 0.81.5"

# 1. Read the RN release notes:
#    https://github.com/facebook/react-native/releases/tag/v0.81.5
#    Look for anything under "🚨 Breaking" or "🛠️ Fixed" that touches
#    modules the app actually uses.

# 2. Check out the branch.
gh pr checkout <PR_NUMBER>

# 3. Reinstall to ensure the lockfile matches:
rm -rf node_modules
npm ci

# 4. Rebuild both variants.
cd android && ./gradlew clean bundleRelease && cd ..

# 5. Install on a physical arm64 device and smoke-test:
#      - login → JWT round-trip
#      - map render (F-08)
#      - camera capture + upload (F-14)
#      - PDF download (F-06)
#      - forced background + resume

# 6. Merge.
```

### 3.2 Minor upgrades (0.81.x → 0.82.x)

Cadence: **once per sprint at most**. RN minor bumps carry breaking
changes (deprecations, new-architecture flag flips, gradle plugin API
migrations). Treat as a mini-project.

Steps:

1. Open [`upgrade-helper.expo.dev`](https://upgrade-helper.expo.dev),
   pick current → target version. Read the diff.
2. Grep the diff for anything that touches:
   - `android/build.gradle`,
   - `android/app/build.gradle` (F-07/F-08/F-15 changes must be
     re-applied by hand if the template lines they modify have shifted),
   - `MainApplication.kt` / `MainActivity.kt` (F-11 keeps
     `android:exported="true"` for MainActivity — do NOT let the
     template regress that),
   - `metro.config.js` (F-15 minifier settings),
   - `babel.config.js` (F-05 remove-console plugin).
3. Apply the diff by hand — do NOT blindly overwrite files. Each of
   our security-hardened files carries inline comments citing the
   audit finding they close; those comments MUST survive the merge.
4. Verify all `-keep` rules in `android/app/proguard-rules.pro` still
   name real classes (a Kotlin / RN package refactor could invalidate a
   keep, silently letting R8 strip a class the app needs at runtime).
5. Rerun the full smoke-test list from §3.1 plus:
   - Fresh install on a factory-reset device (tests cold start path).
   - Root-detected device (tests F-13 IntegrityService block screen).
   - Airplane-mode ↔ online transition (tests background sync).
6. Bump `versionCode` in `android/app/build.gradle`.

### 3.3 Major upgrades (0.x → 1.x when it lands)

Cadence: **planned migration**. Do not accept a Dependabot PR for a
major RN bump — close it and open a tracking issue instead. Major
bumps warrant a dedicated branch, a written migration plan, and
regression testing on every supported Android version the app claims
to run on (currently API 24-34).

### 3.4 Non-RN packages

Cadence: **weekly Dependabot review**. Group PRs by ecosystem
(`react-navigation`, `redux-family`, `babel-toolchain`, `types`,
`other-patches`) so the reviewer sees one intended change per PR.

For each non-RN Dependabot PR:

1. Read the changelog. If the diff mentions "security", "CVE", or
   "advisory", elevate to the next 24-hour merge window.
2. Read the transitive dep delta (`git diff package-lock.json`).
   Unexpected new packages ⇒ investigate before merge.
3. Verify F-12 denylist still passes (`npm run security:denylist`).
4. Merge only after `npm run deps:audit` reports clean.

---

## 4. Ongoing audit commands

These are wired as `package.json` scripts so nobody needs to remember
the flags.

```bash
# Fail if any dependency has a known vulnerability at moderate+ severity.
# `--omit=dev` scopes to what actually ships (devDeps are dev-machine-only).
npm run deps:audit

# The dev-inclusive variant. Run before publishing a build to catch
# advisories in Babel / eslint / jest that could hurt the build pipeline.
npm run deps:audit:full

# List every package with an available upgrade. `|| true` prevents non-zero
# exit codes from breaking scripts that chain this.
npm run deps:outdated

# One-shot: outdated + audit. Recommended cadence: weekly, alongside the
# Dependabot review.
npm run deps:check
```

Recommended cron / CI wiring (not yet configured — see §7):

```yaml
# .github/workflows/audit.yml (future)
on:
  schedule:
    - cron: "0 3 * * 1"   # Mondays 03:00 UTC — 1h before Dependabot fires
  workflow_dispatch:
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
      - run: npm ci
      - run: npm run deps:audit
```

---

## 5. Node / npm version pinning

- `.nvmrc` → `20` (major-only pin). `nvm use` picks the latest 20.x
  LTS installed locally. Reproducibility is guaranteed at the RN
  compatibility boundary (RN 0.81 supports Node 18-22; we pin to 20
  as a stable middle).
- `package.json` `"engines": { "node": ">=20" }` — the belt to the
  `.nvmrc` braces. `npm install --engine-strict` (or npm's default
  behaviour in some configurations) refuses to install on the wrong
  Node major.
- `package-lock.json` — committed. Reproducible installs across
  every developer machine and CI runner. Do NOT delete on merge
  conflict resolution; regenerate with `npm install --package-lock-only`
  after manually resolving `package.json`.

---

## 6. Enforcement summary

| Layer | Mechanism | What it catches |
| --- | --- | --- |
| Local dev, every install | `scripts/security-denylist.js` in `postinstall` | Denylisted packages added; RN family drift |
| Local dev, on demand | `npm run deps:check` | Outdated packages, published CVE advisories |
| Automated PR proposal | `.github/dependabot.yml` | New patch / minor RN releases, transitive dep updates, GitHub Actions bumps |
| Repo-level | `.nvmrc` + `engines` field | Wrong Node major |
| Repo-level | `package-lock.json` committed | Non-reproducible installs across machines |
| Native side | `react-native.config.js` autolink denylist | Denylisted native module re-added via a peer dep |

If any one layer fails to catch a drift, the next layer downstream
catches it. Do not remove a layer without replacing it with an
equivalent one.

---

## 7. Follow-ups

- **CI vulnerability audit workflow** — `.github/workflows/audit.yml`
  running `npm run deps:audit` weekly. Blocks the pipeline on
  moderate+ advisories. Draft skeleton in §4 above; wiring blocked
  on the repo having any CI at all today (no `.github/workflows/`
  directory exists yet).
- **Lockfile provenance signature** — `npm ci --audit-signatures`
  (npm 11+) verifies every downloaded tarball against the registry's
  ECDSA signature. Adopt once the dev / CI Node baseline hits npm 11.
  Meanwhile, `npm audit signatures` can be run manually to spot-check.
- **Renovate migration** — Dependabot is fine for RKSK's current
  scale but Renovate has richer grouping (regex-matched families,
  monorepo awareness) and per-package severity policies. Only worth
  the switch if the team grows or if additional RN native modules
  push the family list past ~40 packages.
- **Native library SBOM diff on every PR** — the `cyclonedxBom`
  task from F-10 already produces a machine-readable SBOM. A CI
  step that runs it on `main` and on the PR head and posts the diff
  as a PR comment would surface any transitive native-lib change
  before merge. Blocked on same CI-wiring gap as above.
