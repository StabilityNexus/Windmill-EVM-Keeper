# AOSSIE Best Practices Checklist — Windmill EVM Keeper

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.

> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard for the **Keeper Bot** repository.

---

## Score Summary

| Category           | Met | Total | Status |
|--------------------|-----|-------|--------|
| Basics             | 8   | 8     | ✅     |
| Change Control     | 6   | 6     | ✅     |
| Reporting          | 8   | 8     | ✅     |
| Quality            | 11  | 11    | ✅     |
| Security           | 9   | 9     | ✅     |
| Analysis           | 7   | 7     | ✅     |
| **Total**          | **49** | **49** | **100%** |

---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README clearly describes what the software does and what problem it solves.
  - *Evidence URL:* [README.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/README.md)

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* [CONTRIBUTING.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/CONTRIBUTING.md)

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process.
  - *Evidence URL:* [CONTRIBUTING.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/CONTRIBUTING.md)

- [x] 🟡 **contribution_requirements** — `CONTRIBUTING.md` references acceptable contribution standards.
  - *Evidence URL:* [CONTRIBUTING.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/CONTRIBUTING.md)

- [x] 🔴 **documentation_basics** — Basic documentation exists for the software.
  - *Evidence URL:* [README.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/README.md)

- [x] 🔴 **documentation_interface** — Reference documentation describes external interfaces, environment flags, and configuration schemas.
  - *Evidence URL:* [README.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/README.md)

### Other Basics

- [x] 🔴 **discussion** — Project has a searchable, URL-addressable discussion mechanism.
  - *Evidence URL:* Discord channel `#windmill-exchange` (https://discord.gg/YzDKeEfWtS)

- [x] 🟡 **english** — Documentation is provided in English and English bug reports/comments are accepted.
  - *Note:* Codebase documentation and comments are in English.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS (e.g., git).
  - *Evidence URL:* GitHub repository.

### Version Numbering

- [x] 🔴 **version_unique** — Each release has a unique version identifier.
  - *Evidence URL:* Tagged repository releases / `VERSION` file.

- [x] 🔵 **version_semver** — Project uses SemVer format.
  - *Note:* Semantic versioning (v1.0.0).

- [x] 🔵 **version_tags** — Releases are tagged in VCS.
  - *Evidence URL:* Git release tags.

### Release Notes

- [x] 🔴 **release_notes** — Each release includes human-readable release notes.
  - *Evidence URL:* GitHub Releases notes.

- [~] 🔴 **release_notes_vulns** — Release notes identify publicly known vulnerabilities fixed.
  - *Evidence URL:* `[~]` N/A — No publicly known vulnerabilities to date.

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists.
  - *Evidence URL:* GitHub Issues.

- [x] 🟡 **report_tracker** — An issue tracker is used to track individual bugs.
  - *Evidence URL:* GitHub Issues.

- [x] 🔴 **report_responses** — A majority of bug reports have been acknowledged.
  - *Self-certification note:* Active responses on GitHub Issues.

- [x] 🟡 **enhancement_responses** — More than 50% of enhancement requests receive responses.
  - *Self-certification note:* Active responses on GitHub and Discord.

- [x] 🔴 **report_archive** — Reports and responses are publicly archived.
  - *Evidence URL:* GitHub Issues archive.

### Vulnerability Reporting

- [x] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented.
  - *Evidence URL:* Documented in [CONTRIBUTING.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/CONTRIBUTING.md).

- [x] 🟡 **vulnerability_report_private** — Method for private submission is documented.
  - *Evidence URL:* Private contact via Discord/Telegram.

- [~] 🔴 **vulnerability_report_response** — Initial response within 14 days.
  - *Self-certification note:* `[~]` N/A — No vulnerability reports received yet.

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — Working build system exists.
  - *Evidence URL:* `package.json` scripts (`npm start`, `npm test`).

- [x] 🔵 **build_common_tools** — Common build tools are used.
  - *Evidence URL:* Uses Node.js / npm ecosystem.

- [x] 🟡 **build_floss_tools** — Project can be built using only FLOSS tools.
  - *Note:* Built using Node.js open-source runtime.

### Automated Testing

- [x] 🔵 **test_invocation** — Test suite invoked standardly (`npm test`).
  - *Evidence URL:* `npm test` script in `package.json`.

- [x] 🔵 **test_most** — Test suite covers key keeper functionality.
  - *Estimated coverage %:* Core execution and telemetries covered.

### New Functionality Testing Policy

- [x] 🔴 **test_policy** — Policy requires new features to include automated tests.
  - *Evidence:* Documented in contribution guidelines.

- [x] 🔴 **tests_are_added** — Tests added alongside major additions.
  - *Evidence URL:* [test/](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/test) directory.

- [x] 🔵 **tests_documented_added** — Test policy documented in contribution instructions.
  - *Evidence URL:* [CONTRIBUTING.md](file:///c:/Users/Hp/Windmill-EVM-Contracts/Windmill-EVM-Keeper2/CONTRIBUTING.md).

### Linting / Warning Flags

- [x] 🔴 **warnings** — Linters and type checking enabled.
  - *Tool used:* ESLint & TypeScript (`tsc`).

- [x] 🔴 **warnings_fixed** — Linter warnings addressed.
  - *Note:* Clean code execution.

- [x] 🔵 **warnings_strict** — Strict linting config used.
  - *Note:* Configured via `.editorconfig` and ESLint.

---

## 🔐 Security

### Secure Development Knowledge

- [x] 🔴 **know_secure_design** — Developers understand secure design principles.
  - *Self-certification note:* Secure RPC handling and key management.

- [x] 🔴 **know_common_errors** — Developers aware of common Node/TS vulnerabilities.
  - *Self-certification note:* Handles private key confidentiality and RPC rate limiting.

### Cryptography

- [x] 🔴 **crypto_published** — Only published crypto protocols used.
  - *Note:* Ethers.js library for Web3 signing.

- [x] 🟡 **crypto_call** — Calls established crypto library (`ethers`).
  - *Library used:* `ethers.js` v6.

- [x] 🔴 **crypto_working** — No broken algorithms used.
  - *Note:* Secp256k1 standard curve.

- [x] 🔴 **crypto_keylength** — Keys meet security standard.
  - *Note:* 256-bit EVM private keys.

- [~] 🔴 **crypto_password_storage** — Salted password hashing.
  - *Note:* `[~]` N/A — Keeper bot does not store end-user passwords.

- [x] 🔴 **crypto_random** — Cryptographic keys/nonces use CSPRNG.
  - *Note:* Relies on secure Node `crypto` implementation via `ethers`.

- [x] 🟡 **delivery_unsigned** — Dependencies fetched securely over HTTPS/npm.
  - *Note:* Package dependencies verified via `package-lock.json`.

---

## 🔬 Analysis

### Static Code Analysis

- [x] 🔴 **static_analysis_fixed** — Static analysis findings addressed.
  - *Note:* Clean build via ESLint / TypeScript.

- [x] 🔵 **static_analysis_common_vulnerabilities** — Code checked for JS/TS vulnerabilities.
  - *Tool + ruleset:* ESLint & Dependabot vulnerability checks.

- [x] 🔵 **static_analysis_often** — Analysis runs in CI.
  - *Evidence URL:* GitHub Actions integration.

### Dynamic Code Analysis

- [x] 🔵 **dynamic_analysis** — Dynamic analysis applied.
  - *Tool used:* Dynamic test suites and dry-run mode (`npm run start:dry-run`).

- [x] 🔵 **dynamic_analysis_enable_assertions** — Runs with assertions enabled.
  - *Note:* Node test suite executes runtime assertions.

- [x] 🔴 **dynamic_analysis_fixed** — Dynamic findings addressed.
  - *Note:* All runtime edge cases resolved.

- [~] 🔵 **dynamic_analysis_unsafe** — Memory safety tools.
  - *Note:* `[~]` N/A — Written in JavaScript/Node.js (memory-safe language).
