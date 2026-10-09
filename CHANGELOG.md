# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-09

### Added
- **Core Environment Parser (`src/core/parser.ts`)**:
  - Extracts variable declarations from environment configuration files.
  - Supports standard `KEY=value`, `export KEY=value`, and variable names prefixed with `export`.
  - Handles comments (`#`) with leading/trailing whitespace, blank lines, CRLF and LF line endings, and values containing multiple `=` characters.
  - Distinguishes empty values (`KEY=`) from present values (`KEY=val`) in the data model.
  - Structured diagnostics for malformed declarations with value masking (`KEY=***`) to guarantee zero secret exposure.
- **Core Validator (`src/core/validator.ts`)**:
  - Compares expected variables against target variables.
  - Accurately tracks missing variables, found variables, totals, and pass/fail status.
  - Deduplicates declarations cleanly while preserving declaration ordering.
- **Terminal UI & Reporter (`src/utils/reporter.ts`)**:
  - Polished terminal output with rounded borders powered by Boxen and Chalk.
  - Color-coded status indicators (`FOUND`, `MISSING`), aligned columns, and summary counts.
  - Masks secret values completely across all output and error panels.
- **CLI Commands (`src/cli/commands.ts`, `src/index.ts`)**:
  - `check`: Validates `.env` against `.env.example`.
  - `--help` / `-h`: Displays usage guide.
  - `--version` / `-v`: Displays package version.
  - Proper exit codes: `0` on success, `1` on missing variables, missing files, or invalid arguments.
- **Testing Suite**:
  - Comprehensive unit and integration test coverage using Vitest (35 tests).
  - Integration tests verifying executable sub-process behavior in isolated temporary directories.
- **CI/CD**:
  - GitHub Actions automated testing matrix across Node.js 20, 22, and 24.
