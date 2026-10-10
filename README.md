# ◆ EnvGuard

**Catch missing environment variables before they cause runtime errors.**

EnvGuard is a lightweight, open-source CLI built with TypeScript and Node.js. It compares `.env.example` with `.env` and reports missing configuration keys through a clean, readable terminal interface.

It checks configuration without printing environment variable values.

## Features

- **Environment checks** — Identify variables declared in `.env.example` but missing from `.env`.
- **Readable terminal reports** — Color-coded status indicators, aligned output and a summary of results.
- **Safe output** — Display variable names and validation statuses without printing their values.
- **Syntax diagnostics** — Report malformed declarations, invalid names and other parsing issues.
- **Export support** — Recognize supported `export KEY=value` declarations.
- **CI-friendly exit codes** — Return `0` on success and `1` when required variables are missing or a command fails.
- **Cross-platform CLI** — Built for Node.js 20+ and tested in CI against Node.js 20, 22 and 24.

## Requirements

- Node.js 20 or newer
- npm
- A `.env.example` file defining the required environment variables
- A `.env` file containing the project's configuration

## Installation

EnvGuard is published to npm as [`@itseghosime/envguard`](https://www.npmjs.com/package/@itseghosime/envguard).

### Option 1 — Install in your project (recommended)

```bash
npm install --save-dev @itseghosime/envguard
```

Run:

```bash
npx envguard check
```

This is recommended for teams because the dependency can be versioned with the project.

### Option 2 — Run without installing

```bash
npx --yes --package=@itseghosime/envguard envguard check
```

### Option 3 — Install globally

```bash
npm install --global @itseghosime/envguard
```

Then run from your project directory:

```bash
envguard check
```

**Important:** The npm package is named `@itseghosime/envguard`, but the terminal executable is named `envguard`.

Do not install the similarly named unscoped packages `envguard` or `env-guard` expecting this project.

## Quick Start

Create a `.env.example` file:

```dotenv
DATABASE_URL=
API_KEY=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
```

Create your `.env` file:

```dotenv
DATABASE_URL=postgresql://localhost:5432/app
API_KEY=example-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Now run:

```bash
npx envguard check
```

EnvGuard identifies that `JWT_SECRET` is missing.

Example terminal report:

```text
◆ ENVGUARD v0.1.0

Environment configuration check

╭─────────────────────────────────────╮
│ CONFIGURATION · .env.example → .env │
│                                     │
│ ✓ DATABASE_URL             FOUND    │
│ ✓ API_KEY                  FOUND    │
│ ✗ JWT_SECRET               MISSING  │
│ ✓ NEXT_PUBLIC_APP_URL      FOUND    │
│                                     │
│ 3 found · 1 missing · 4 total       │
╰─────────────────────────────────────╯
```

The actual terminal report adapts to your terminal width.

## Available Commands

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `envguard check`     | Validate required environment variable names |
| `envguard --help`    | Display usage information                    |
| `envguard -h`        | Short help option                            |
| `envguard --version` | Display the installed version                |
| `envguard -v`        | Short version option                         |

### Exit Codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Successful validation or informational command                  |
| `1`  | Missing variables, unreadable required files or invalid command |

These exit codes make EnvGuard useful in local scripts and automated workflows.

## Environment File Support

In v0.1.0, EnvGuard checks:

`.env.example` → `.env`

Both files must be in the directory where the command is executed.

The following files are **not automatically loaded or checked**:

- `.env.local`
- `.env.development`
- `.env.development.local`
- `.env.production`
- `.env.production.local`

For Next.js developers: if your application stores its configuration exclusively in `.env.local`, EnvGuard v0.1.0 will not automatically recognize those declarations.

Custom file paths and framework-aware checks are potential future improvements.

### Empty Values

EnvGuard currently validates variable **presence**, not value correctness.

For example, this is considered present:

```dotenv
DATABASE_URL=
```

The tool does not yet validate that the value is non-empty, a valid URL or a particular data type.

## Troubleshooting

### `envguard: command not found`

If installed locally, run:

```bash
npx envguard --help
```

Or use the project-local binary directly:

```bash
./node_modules/.bin/envguard --help
```

If installed globally, verify installation with:

```bash
npm list --global --depth=0
```

Make sure npm's global executable directory is available in your shell's `PATH`.

### `Cannot find package 'chalk'`

If this error references an EnvGuard source directory on your machine, your shell may still be using an old development installation created with `npm link`.

Check:

```bash
which envguard
ls -l "$(which envguard)"
npm list --global --depth=0
```

If the executable points to a development checkout instead of a normal npm installation, unlink or uninstall that development installation using its installed package name.

For example:

```bash
npm unlink --global envguard
npm uninstall --global envguard
```

Then install the published package:

```bash
npm install --global @itseghosime/envguard
```

On zsh, refresh the command lookup:

```bash
rehash
```

Verify:

```bash
envguard --version
envguard --help
```

If the error persists with a normal package installation, report it through GitHub Issues with the Node.js version, installation command and error output. Do not include secrets.

### `.env` or `.env.example` not found

Ensure both files exist in the directory where you run EnvGuard.

Version 0.1.0 does not support choosing alternative file paths from command-line flags.

### CLI runs but reports missing variables

Compare `.env.example` against `.env`.

Ensure required variable names are spelled consistently. Variable names are case-sensitive.

Do not paste real API keys or credentials into public GitHub issues.

## Development

### Clone and install

```bash
git clone https://github.com/itseghosime/envguard.git
cd envguard
npm ci
```

### Development commands

| Command                 | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `npm run dev -- check`  | Run the CLI from TypeScript source         |
| `npm run build`         | Build the distribution with tsup           |
| `npm run typecheck`     | Run TypeScript type checks                 |
| `npm test`              | Build and execute the automated test suite |
| `npm run test:watch`    | Run Vitest in watch mode                   |
| `npm run test:coverage` | Generate test coverage results             |
| `npm run check`         | Run type checking and tests                |

The test setup builds the CLI before running compiled-binary integration tests.

### Project Structure

```text
src/
├── index.ts
├── cli/
│   └── commands.ts
├── core/
│   ├── parser.ts
│   └── validator.ts
└── utils/
    └── reporter.ts

tests/
├── cli.test.ts
├── parser.test.ts
└── validator.test.ts
```

The modules separate command handling, parsing, validation and terminal presentation.

### Local CLI development with npm link

Contributors can use `npm link` to test the CLI globally while developing it.

Be aware that linking points the global executable to your local development checkout. If that directory is moved or its dependencies are unavailable, the global command may fail.

After development, remove the link and reinstall from npm if you want to test the published version.

## Security

EnvGuard is designed to inspect configuration declarations without printing their values.

- Environment values are not included in validation reports.
- Diagnostics mask sensitive declaration values.
- The tool does not intentionally modify environment files.
- Real `.env` files should be excluded from version control.

Do not treat EnvGuard as a secret manager, encryption tool or complete security scanner.

If you discover a security issue, avoid disclosing sensitive exploit details or credentials in public discussions.

## Roadmap

Potential future enhancements:

- Custom source and target files
- Optional empty-value validation
- Next.js and other framework-aware environment checking
- JSON output for CI workflows
- Typed configuration schema validation

Feature priorities will be guided by developer feedback.

## Contributing

Contributions, suggestions and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Include meaningful tests.
5. Run `npm run check`.
6. Submit a pull request describing the problem and solution.

Please follow the project's existing Conventional Commit style.

## Links

- [npm Package](https://www.npmjs.com/package/@itseghosime/envguard)
- [GitHub Repository](https://github.com/itseghosime/envguard)
- [Report an Issue](https://github.com/itseghosime/envguard/issues)
- [Releases](https://github.com/itseghosime/envguard/releases)

## License

MIT © 2026 Itseghosime.

See [LICENSE](https://github.com/itseghosime/envguard/blob/main/LICENSE).

---

Built to make environment configuration checks simpler, clearer and safer.
