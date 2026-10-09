import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "../core/parser.js";
import { validateEnv } from "../core/validator.js";
import {
  renderHeader,
  renderHelp,
  renderReport,
  renderError,
  renderUnknownCommand,
} from "../utils/reporter.js";

export const VERSION = "0.1.0";

export interface CommandOptions {
  cwd?: string;
  sourceFile?: string;
  targetFile?: string;
  stdout?: (msg: string) => void;
  stderr?: (msg: string) => void;
}

export function readConfigFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Cannot find ${filePath} in the current directory.`);
    }
    throw error;
  }
}

export function runCheck(options?: CommandOptions): number {
  const log = options?.stdout ?? console.log;
  const logError = options?.stderr ?? console.error;
  const sourceName = options?.sourceFile ?? ".env.example";
  const targetName = options?.targetFile ?? ".env";
  const cwd = options?.cwd ?? process.cwd();

  log(renderHeader(VERSION));

  try {
    const sourcePath = resolve(cwd, sourceName);
    const targetPath = resolve(cwd, targetName);

    // Pass sourceName and targetName in errors for clean presentation
    let sourceContent: string;
    try {
      sourceContent = readConfigFile(sourcePath);
    } catch {
      throw new Error(`Cannot find ${sourceName} in the current directory.`);
    }

    let targetContent: string;
    try {
      targetContent = readConfigFile(targetPath);
    } catch {
      throw new Error(`Cannot find ${targetName} in the current directory.`);
    }

    const expectedParsed = parseEnv(sourceContent);
    const actualParsed = parseEnv(targetContent);
    const result = validateEnv(expectedParsed, actualParsed);

    log(renderReport(result, { sourceFile: sourceName, targetFile: targetName }));

    return result.isValid ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError(renderError(message));
    return 1;
  }
}

export function runCli(args: string[], options?: CommandOptions): number {
  const log = options?.stdout ?? console.log;
  const logError = options?.stderr ?? console.error;
  const command = args[0];

  if (args.length === 0 || (args.length === 1 && (command === "-h" || command === "--help"))) {
    log(renderHelp(VERSION));
    return 0;
  }

  if (args.length === 1 && (command === "-v" || command === "--version")) {
    log(VERSION);
    return 0;
  }

  if (args.length === 1 && command === "check") {
    return runCheck(options);
  }

  logError(renderUnknownCommand(args));
  return 1;
}
