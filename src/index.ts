#!/usr/bin/env node
import { readFileSync } from "node:fs";
import chalk from "chalk";
import boxen from "boxen";

const VERSION = "0.1.0";
const INDENT = "  ";

function extractNames(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const declaration = line.startsWith("export ")
        ? line.slice(7).trimStart()
        : line;
      return (declaration.split("=")[0] ?? "").trim();
    })
    .filter((name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
}

function readFile(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Cannot find ${path} in the current directory.`);
    }
    throw error;
  }
}

function printHeader(): void {
  console.log();
  console.log(`${INDENT}${chalk.cyan.bold("◆ ENVGUARD")} ${chalk.dim(`v${VERSION}`)}`);
  console.log(`${INDENT}${chalk.dim("Environment configuration check")}`);
  console.log();
}

function check(): void {
  printHeader();

  try {
    const expected = [...new Set(extractNames(readFile(".env.example")))];
    const actual = new Set(extractNames(readFile(".env")));
    const missing = expected.filter((name) => !actual.has(name));
    const missingSet = new Set(missing);
    const passed = expected.length - missing.length;

    // Fit a compact report to the terminal without dumping any secret values.
    const terminalWidth = process.stdout.columns || 80;
    const boxWidth = Math.max(32, Math.min(72, terminalWidth - 4));
    const innerWidth = boxWidth - 6; // box borders and padding
    const statusWidth = 9;
    const nameWidth = innerWidth - statusWidth - 5;

    const heading = `${chalk.bold("CONFIGURATION")} ${chalk.dim("· .env.example → .env")}`;
    const divider = chalk.dim("─".repeat(innerWidth));

    const rows = expected.map((name) => {
      const isMissing = missingSet.has(name);
      const visibleName = name.length > nameWidth
        ? `${name.slice(0, Math.max(1, nameWidth - 1))}…`
        : name;
      const label = visibleName.padEnd(nameWidth);
      const symbol = isMissing ? chalk.red("✗") : chalk.green("✓");
      const status = isMissing ? chalk.red.bold("MISSING") : chalk.green("FOUND");
      return ` ${symbol}  ${chalk.white(label)} ${status}`;
    });

    const summary = missing.length === 0
      ? `${chalk.green.bold("✓  All required variables found")}`
      : `${chalk.red.bold("✗  Configuration needs attention")}`;

    const totalText = `${chalk.green.bold(String(passed))} ${chalk.dim("found")}   ${chalk.red.bold(String(missing.length))} ${chalk.dim("missing")}   ${chalk.dim(`${expected.length} total`)}`;
    const note = missing.length
      ? chalk.dim("Add the missing variable names to .env, then rerun.")
      : chalk.dim("Names are present. Values are not validated yet.");

    // No misleading loading spinner: this check is synchronous and fast.
    const lines = [
      heading,
      divider,
      ...(rows.length ? rows : [chalk.yellow("No variables declared in .env.example")]),
      divider,
      summary,
      totalText,
      note,
    ];

    console.log(
      boxen(lines.join("\n"), {
        width: boxWidth,
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: { left: 2, right: 0, top: 0, bottom: 0 },
        borderStyle: "round",
        borderColor: "gray",
      })
    );

    console.log(`${INDENT}${chalk.dim("Source")} ${chalk.white(".env.example")}  ${chalk.dim("→ Target")} ${chalk.white(".env")}`);
    console.log();
    process.exitCode = missing.length > 0 ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      boxen(`${chalk.red.bold("✗ Unable to check configuration")}\n\n${message}`, {
        padding: 1,
        margin: { left: 2, top: 0, bottom: 1 },
        borderStyle: "round",
        borderColor: "red",
      })
    );
    process.exitCode = 1;
  }
}

function printHelp(): void {
  console.log(`
  ${chalk.cyan.bold("◆ ENVGUARD")} ${chalk.dim(`v${VERSION}`)}

  ${chalk.bold("Usage")}
    envguard <command>

  ${chalk.bold("Commands")}
    check          Check .env against .env.example

  ${chalk.bold("Options")}
    -h, --help     Show this help
    -v, --version  Show the version

  ${chalk.bold("Examples")}
    envguard check
    envguard --help
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (args.length === 0 || (args.length === 1 && ["-h", "--help"].includes(command!))) {
    printHelp();
    return;
  }

  if (args.length === 1 && ["-v", "--version"].includes(command!)) {
    console.log(VERSION);
    return;
  }

  if (args.length === 1 && command === "check") {
    check();
    return;
  }

  console.error(chalk.red(`Unknown command or argument: ${args.join(" ")}`));
  console.error(chalk.dim("Run envguard --help to see available commands."));
  process.exitCode = 1;
}

main();
