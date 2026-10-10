import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli/commands.js";

const CLI_PATH = resolve(__dirname, "../dist/index.js");
const PKG_PATH = resolve(__dirname, "../package.json");

function getPackageVersion(): string {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
  return pkg.version;
}

// Helper to strip ANSI escape codes for predictable visual structure testing
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

describe("CLI Integration Tests", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "envguard-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("In-process command runner", () => {
    it("returns exit code 0 when all variables exist", () => {
      writeFileSync(join(tempDir, ".env.example"), "PORT=\nDATABASE_URL=\n");
      writeFileSync(join(tempDir, ".env"), "PORT=3000\nDATABASE_URL=postgres://...\n");

      const stdout: string[] = [];
      const stderr: string[] = [];

      const exitCode = runCli(["check"], {
        cwd: tempDir,
        stdout: (msg) => stdout.push(msg),
        stderr: (msg) => stderr.push(msg),
      });

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);

      const output = stripAnsi(stdout.join("\n"));
      expect(output).toContain("◆ ENVGUARD");
      expect(output).toContain("CONFIGURATION · .env.example → .env");
      expect(output).toContain("PORT");
      expect(output).toContain("DATABASE_URL");
      expect(output).toContain("FOUND");
      expect(output).toContain("All required variables found");
      expect(output).toContain("2 found   0 missing   2 total");
    });

    it("returns exit code 1 when variables are missing", () => {
      writeFileSync(join(tempDir, ".env.example"), "PORT=\nAPI_KEY=\n");
      writeFileSync(join(tempDir, ".env"), "PORT=3000\n");

      const stdout: string[] = [];
      const stderr: string[] = [];

      const exitCode = runCli(["check"], {
        cwd: tempDir,
        stdout: (msg) => stdout.push(msg),
        stderr: (msg) => stderr.push(msg),
      });

      expect(exitCode).toBe(1);
      const output = stripAnsi(stdout.join("\n"));
      expect(output).toContain("API_KEY");
      expect(output).toContain("MISSING");
      expect(output).toContain("Configuration needs attention");
      expect(output).toContain("1 found   1 missing   2 total");
      expect(output).toContain("Add the missing variable names to .env, then rerun.");
    });

    it("returns exit code 1 with styled error when .env.example is missing", () => {
      writeFileSync(join(tempDir, ".env"), "PORT=3000\n");

      const stdout: string[] = [];
      const stderr: string[] = [];

      const exitCode = runCli(["check"], {
        cwd: tempDir,
        stdout: (msg) => stdout.push(msg),
        stderr: (msg) => stderr.push(msg),
      });

      expect(exitCode).toBe(1);
      const errOutput = stripAnsi(stderr.join("\n"));
      expect(errOutput).toContain("Unable to check configuration");
      expect(errOutput).toContain("Cannot find .env.example in the current directory.");
    });

    it("returns exit code 1 with styled error when .env is missing", () => {
      writeFileSync(join(tempDir, ".env.example"), "PORT=3000\n");

      const stdout: string[] = [];
      const stderr: string[] = [];

      const exitCode = runCli(["check"], {
        cwd: tempDir,
        stdout: (msg) => stdout.push(msg),
        stderr: (msg) => stderr.push(msg),
      });

      expect(exitCode).toBe(1);
      const errOutput = stripAnsi(stderr.join("\n"));
      expect(errOutput).toContain("Unable to check configuration");
      expect(errOutput).toContain("Cannot find .env in the current directory.");
    });

    it("shows help on --help, -h, and with no arguments (exit code 0)", () => {
      const pkgVersion = getPackageVersion();

      for (const argList of [[], ["--help"], ["-h"]]) {
        const stdout: string[] = [];
        const exitCode = runCli(argList, {
          stdout: (msg) => stdout.push(msg),
        });

        expect(exitCode).toBe(0);
        const output = stripAnsi(stdout.join("\n"));
        expect(output).toContain(`◆ ENVGUARD v${pkgVersion}`);
        expect(output).toContain("Usage");
        expect(output).toContain("envguard <command>");
        expect(output).toContain("check");
      }
    });

    it("shows version matching package.json on --version and -v (exit code 0)", () => {
      const pkgVersion = getPackageVersion();

      for (const arg of ["--version", "-v"]) {
        const stdout: string[] = [];
        const exitCode = runCli([arg], {
          stdout: (msg) => stdout.push(msg),
        });

        expect(exitCode).toBe(0);
        expect(stdout[0]?.trim()).toBe(pkgVersion);
      }
    });

    it("returns exit code 1 for unknown commands", () => {
      const stderr: string[] = [];
      const exitCode = runCli(["foobar"], {
        stderr: (msg) => stderr.push(msg),
      });

      expect(exitCode).toBe(1);
      const output = stripAnsi(stderr.join("\n"));
      expect(output).toContain("Unknown command or argument: foobar");
      expect(output).toContain("Run envguard --help to see available commands.");
    });

    it("surfaces syntax diagnostics in report when target has malformed line", () => {
      writeFileSync(join(tempDir, ".env.example"), "PORT=\n");
      writeFileSync(join(tempDir, ".env"), "PORT=3000\nMALFORMED-KEY=test_value\n");

      const stdout: string[] = [];
      const exitCode = runCli(["check"], {
        cwd: tempDir,
        stdout: (msg) => stdout.push(msg),
      });

      expect(exitCode).toBe(0);
      const output = stripAnsi(stdout.join("\n"));
      expect(output).toContain("Syntax warnings:");
      expect(output).toContain(".env:2: Invalid variable name identifier");
      expect(output).toContain("MALFORMED-KEY=***");
      // Value must never be leaked
      expect(output).not.toContain("test_value");
    });
  });

  describe("Built binary execution (node dist/index.js)", () => {
    it("executes 'check' successfully via child process", () => {
      writeFileSync(join(tempDir, ".env.example"), "KEY_A=\nKEY_B=\n");
      writeFileSync(join(tempDir, ".env"), "KEY_A=alpha\nKEY_B=beta\n");

      const output = execFileSync("node", [CLI_PATH, "check"], {
        cwd: tempDir,
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1" },
      });

      expect(output).toContain("◆ ENVGUARD");
      expect(output).toContain("All required variables found");
      expect(output).toContain("2 found   0 missing   2 total");
    });

    it("fails with exit code 1 when variables missing via child process", () => {
      writeFileSync(join(tempDir, ".env.example"), "KEY_A=\nKEY_B=\n");
      writeFileSync(join(tempDir, ".env"), "KEY_A=alpha\n");

      expect(() => {
        execFileSync("node", [CLI_PATH, "check"], {
          cwd: tempDir,
          encoding: "utf8",
          env: { ...process.env, NO_COLOR: "1" },
        });
      }).toThrowError();
    });

    it("executes '--version' and output matches package.json", () => {
      const pkgVersion = getPackageVersion();
      const output = execFileSync("node", [CLI_PATH, "--version"], {
        encoding: "utf8",
      });
      expect(output.trim()).toBe(pkgVersion);
    });

    it("executes '--help' and prints usage guide", () => {
      const pkgVersion = getPackageVersion();
      const output = execFileSync("node", [CLI_PATH, "--help"], {
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1" },
      });
      expect(output).toContain(`◆ ENVGUARD v${pkgVersion}`);
      expect(output).toContain("Usage");
      expect(output).toContain("envguard <command>");
    });
  });
});
