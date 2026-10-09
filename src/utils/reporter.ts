import chalk from "chalk";
import boxen from "boxen";
import type { ValidationResult } from "../core/validator.js";

const INDENT = "  ";

export function renderHeader(version: string): string {
  return [
    "",
    `${INDENT}${chalk.cyan.bold("◆ ENVGUARD")} ${chalk.dim(`v${version}`)}`,
    `${INDENT}${chalk.dim("Environment configuration check")}`,
    "",
  ].join("\n");
}

export function renderHelp(version: string): string {
  return `
  ${chalk.cyan.bold("◆ ENVGUARD")} ${chalk.dim(`v${version}`)}

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
`;
}

export function renderReport(
  result: ValidationResult,
  options?: { columns?: number; sourceFile?: string; targetFile?: string }
): string {
  const source = options?.sourceFile ?? ".env.example";
  const target = options?.targetFile ?? ".env";

  // Terminal box sizing
  const terminalWidth = options?.columns ?? (process.stdout.columns || 80);
  const boxWidth = Math.max(32, Math.min(72, terminalWidth - 4));
  const innerWidth = boxWidth - 6; // box borders and padding
  const statusWidth = 9;
  const nameWidth = innerWidth - statusWidth - 5;

  const heading = `${chalk.bold("CONFIGURATION")} ${chalk.dim(`· ${source} → ${target}`)}`;
  const divider = chalk.dim("─".repeat(innerWidth));

  const missingSet = new Set(result.missing);

  const rows = result.expected.map((name) => {
    const isMissing = missingSet.has(name);
    const visibleName =
      name.length > nameWidth
        ? `${name.slice(0, Math.max(1, nameWidth - 1))}…`
        : name;
    const label = visibleName.padEnd(nameWidth);
    const symbol = isMissing ? chalk.red("✗") : chalk.green("✓");
    const status = isMissing ? chalk.red.bold("MISSING") : chalk.green("FOUND");
    return ` ${symbol}  ${chalk.white(label)} ${status}`;
  });

  const summary =
    result.missing.length === 0
      ? `${chalk.green.bold("✓  All required variables found")}`
      : `${chalk.red.bold("✗  Configuration needs attention")}`;

  const totalText = `${chalk.green.bold(String(result.passed))} ${chalk.dim("found")}   ${chalk.red.bold(String(result.missing.length))} ${chalk.dim("missing")}   ${chalk.dim(`${result.expected.length} total`)}`;
  const note = result.missing.length
    ? chalk.dim(`Add the missing variable names to ${target}, then rerun.`)
    : chalk.dim("Names are present. Values are not validated yet.");

  const lines = [
    heading,
    divider,
    ...(rows.length ? rows : [chalk.yellow(`No variables declared in ${source}`)]),
    divider,
    summary,
    totalText,
    note,
  ];

  // If there are diagnostics in the source or target, report them without leaking secret values
  const allDiagnostics = [
    ...result.expectedDiagnostics.map((d) => ({ ...d, file: source })),
    ...result.actualDiagnostics.map((d) => ({ ...d, file: target })),
  ];

  if (allDiagnostics.length > 0) {
    lines.push(divider);
    lines.push(chalk.yellow.bold("⚠  Syntax warnings:"));
    for (const d of allDiagnostics) {
      lines.push(chalk.dim(`  ${d.file}:${d.lineNumber}: ${d.message} (${d.rawLine})`));
    }
  }

  const box = boxen(lines.join("\n"), {
    width: boxWidth,
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    margin: { left: 2, right: 0, top: 0, bottom: 0 },
    borderStyle: "round",
    borderColor: "gray",
  });

  const footer = `${INDENT}${chalk.dim("Source")} ${chalk.white(source)}  ${chalk.dim("→ Target")} ${chalk.white(target)}\n`;

  return `${box}\n${footer}`;
}

export function renderError(message: string): string {
  return boxen(`${chalk.red.bold("✗ Unable to check configuration")}\n\n${message}`, {
    padding: 1,
    margin: { left: 2, top: 0, bottom: 1 },
    borderStyle: "round",
    borderColor: "red",
  });
}

export function renderUnknownCommand(args: string[]): string {
  return [
    chalk.red(`Unknown command or argument: ${args.join(" ")}`),
    chalk.dim("Run envguard --help to see available commands."),
  ].join("\n");
}
