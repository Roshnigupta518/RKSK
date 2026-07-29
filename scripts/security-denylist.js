#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Security denylist check.
 *
 * Fails the install with a non-zero exit code if package.json references
 * any package that the security review has explicitly forbidden. Runs
 * from the `postinstall` npm script so it catches:
 *
 *   - a fresh `npm ci` on CI,
 *   - `npm install <package>` on a dev machine, and
 *   - a `git pull` that reintroduced a banned entry into package.json.
 *
 * The corresponding native-side belt-and-braces defense lives in
 * `react-native.config.js` under the `dependencies` block, which
 * short-circuits React Native autolinking for the same package list.
 * Keep the two in sync — every entry here needs a matching entry there.
 *
 * See android/NATIVE_MODULES.md for the rationale behind each entry.
 */

const fs = require('fs');
const path = require('path');

// Each entry documents (a) the audit finding it closes and (b) a one-line
// summary of what the package does that we don't want in the app.
const DENYLIST = [
    {
        name: 'react-native-send-intent',
        finding: 'F-12',
        why:
            'RNSendIntentModule exposes getPhoneNumber() / getVoicemailNumber() ' +
            'over the RN bridge and requires READ_PHONE_STATE. A supply-chain ' +
            "or hostile-JS attacker can read the user's phone number silently.",
        replacement:
            "Linking.sendIntent(<ACTION>) for the narrow 'open Android settings' " +
            'use-case; see src/hooks/useLocation.js and src/hooks/useLocationStatus.js.',
    },
    // Add new entries here as future audit findings close out. Keep the
    // matching react-native.config.js `dependencies` block in sync.
];

function readPkg() {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    if (!fs.existsSync(pkgPath)) {
        console.error(
            '\x1b[31m[security-denylist] Could not locate package.json at ' +
                pkgPath +
                '\x1b[0m',
        );
        process.exit(2);
    }
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function collectDeclaredDeps(pkg) {
    return {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
        ...(pkg.optionalDependencies || {}),
    };
}

function main() {
    const pkg = readPkg();
    const declared = collectDeclaredDeps(pkg);

    const hits = DENYLIST.filter((entry) =>
        Object.prototype.hasOwnProperty.call(declared, entry.name),
    );

    if (hits.length === 0) {
        // Silent success — keeps install output uncluttered.
        return;
    }

    console.error('');
    console.error(
        '\x1b[31m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m',
    );
    console.error(
        '\x1b[31m║ SECURITY DENYLIST VIOLATION — install aborted                        ║\x1b[0m',
    );
    console.error(
        '\x1b[31m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m',
    );
    console.error('');
    console.error(
        'The following package(s) are on the RKSK security denylist and must',
    );
    console.error('not appear in package.json:');
    console.error('');
    for (const hit of hits) {
        console.error(`  ✗ ${hit.name}   (finding: ${hit.finding})`);
        console.error(`      why:         ${hit.why}`);
        console.error(`      replacement: ${hit.replacement}`);
        console.error('');
    }
    console.error(
        'Remove the entry from package.json and delete it from node_modules,',
    );
    console.error(
        'then rerun `npm install`. See android/NATIVE_MODULES.md for the full',
    );
    console.error('policy on adding or removing native modules.');
    console.error('');

    process.exit(1);
}

main();
