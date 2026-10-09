# EnvGuard

A lightweight, zero-dependency CLI tool built with TypeScript to validate environment variable configuration by comparing `.env.example` with `.env`.

EnvGuard ensures your target `.env` file defines all required variable names before your application starts or builds, without exposing or logging secret values.

---

## Features

- **Presence Validation**: Verifies that every environment variable declared in `.env.example` exists in `.env`.
- **Zero Secret Exposure**: Environment values are never logged, formatted, or printed to the terminal. Only variable names and status indicators are shown.
- **Terminal UI**: Clean, rounded border reporting with aligned columns, status indicators (`FOUND`, `MISSING`), and total counts.
- **Syntax Diagnostics**: Detects and highlights malformed declarations (missing `=` delimiters, invalid identifier syntax) while masking sensitive values.
- **Export Syntax Support**: Supports standard `export KEY=value` declarations and preserves variables named starting with `export`.
- **Exit Code Integrity**: Returns code `0` on successful check, and code `1` when variables are missing, files cannot be read, or unknown commands are supplied.

---

## Installation

### From Source (Current)

Clone the repository and install dependencies:

```bash
git clone https://github.com/itseghosime/envguard.git
cd envguard
npm ci
npm run build
npm link
```

### After npm Publication

Once published to the npm registry, EnvGuard will be available via:

```bash
# Direct execution with npx
npx envguard check

# Local project dependency
npm install -D envguard

# Global installation
npm install -g envguard
```

---

## Usage

### Validate Environment Configuration

Run the `check` command in the root of your project:

```bash
envguard check
```

**Example output:**

```text
  ◆ ENVGUARD v0.1.0
  Environment configuration check

  ╭──────────────────────────────────────────────────────────────────────╮
  │                                                                      │
  │  CONFIGURATION · .env.example → .env                                 │
  │  ──────────────────────────────────────────────────────────────────  │
  │   ✓  DATABASE_URL                                         FOUND      │
  │   ✓  API_KEY                                              FOUND      │
  │   ✗  JWT_SECRET                                           MISSING    │
  │   ✓  NEXT_PUBLIC_APP_URL                                  FOUND      │
  │  ──────────────────────────────────────────────────────────────────  │
  │  ✗  Configuration needs attention                                    │
  │  3 found   1 missing   4 total                                       │
  │  Add the missing variable names to .env, then rerun.                 │
  │                                                                      │
  ╰──────────────────────────────────────────────────────────────────────╯
  Source .env.example  → Target .env
```

### Display Help

```bash
envguard --help
# or
envguard -h
```

### Display Version

```bash
envguard --version
# or
envguard -v
```

---

## Exit Codes

| Code | Description |
| :--- | :--- |
| `0` | Success: All required variables are present, or `--help`/`--version` was requested. |
| `1` | Failure: One or more variables are missing, `.env` or `.env.example` not found, or invalid command invoked. |

---

## Development & Testing

### Prerequisites

- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/itseghosime/envguard.git
cd envguard
npm install
```

### Scripts

- **`npm run dev`**: Run CLI directly using `tsx` (e.g. `npm run dev -- check`).
- **`npm run build`**: Compile TypeScript files into `dist/` with `tsup`.
- **`npm run typecheck`**: Run TypeScript compiler type checking (`tsc --noEmit`).
- **`npm test`**: Run automated unit and integration tests with Vitest.
- **`npm run test:watch`**: Run tests in watch mode.
- **`npm run test:coverage`**: Run test suite with V8 coverage analysis.
- **`npm run check`**: Run type checking followed by the test suite.

---

## Current Limitations

- **File Paths**: EnvGuard currently inspects `.env.example` and `.env` in the current working directory. Custom paths via CLI flags (e.g., `--file` or `--source`) are planned for a subsequent release.
- **Value Validation**: EnvGuard checks for variable presence in `.env`. It tracks empty values internally in the data model but does not enforce type/format constraints (e.g., regex matching, URL or port validation) at this stage.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository and create a feature branch.
2. Ensure code compiles cleanly with `npm run check`.
3. Add meaningful unit and integration tests for any parser, validator, or CLI changes.
4. Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
5. Open a Pull Request with a clear description of the problem solved.

---

## License

[MIT](LICENSE) © 2026 Itseghosime
