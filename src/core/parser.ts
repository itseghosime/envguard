export interface Diagnostic {
  lineNumber: number;
  rawLine: string;
  message: string;
}

export interface ParsedVariable {
  name: string;
  lineNumber: number;
  hasValue: boolean;
  isExported: boolean;
}

export interface ParseResult {
  /**
   * Distinct valid variable names in order of their first appearance.
   */
  names: string[];
  /**
   * All parsed variable declarations including duplicates.
   */
  variables: ParsedVariable[];
  /**
   * Variable names that appeared more than once.
   */
  duplicates: string[];
  /**
   * Malformed lines that could not be parsed as valid declarations.
   * Notice: values are never stored or exposed here.
   */
  diagnostics: Diagnostic[];
}

const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Parses environment file contents and extracts variable declarations and diagnostics.
 * Never stores or exposes raw environment variable values.
 */
export function parseEnv(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const variables: ParsedVariable[] = [];
  const diagnostics: Diagnostic[] = [];
  const seenNames = new Set<string>();
  const duplicateNames = new Set<string>();
  const names: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    // Skip empty lines or comment lines
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    let declaration = trimmed;
    let isExported = false;

    // Check for "export " prefix
    if (declaration.startsWith("export ") || declaration.startsWith("export\t")) {
      isExported = true;
      declaration = declaration.slice(6).trimStart();
    }

    const equalIndex = declaration.indexOf("=");
    if (equalIndex === -1) {
      diagnostics.push({
        lineNumber,
        rawLine: sanitizeRawLine(trimmed),
        message: "Missing '=' delimiter in declaration",
      });
      continue;
    }

    const key = declaration.slice(0, equalIndex).trim();
    const valuePart = declaration.slice(equalIndex + 1).trim();
    const hasValue = valuePart.length > 0;

    if (key === "") {
      diagnostics.push({
        lineNumber,
        rawLine: sanitizeRawLine(trimmed),
        message: "Empty variable name",
      });
      continue;
    }

    if (!IDENTIFIER_REGEX.test(key)) {
      diagnostics.push({
        lineNumber,
        rawLine: sanitizeRawLine(trimmed),
        message: `Invalid variable name identifier: "${key}"`,
      });
      continue;
    }

    if (seenNames.has(key)) {
      duplicateNames.add(key);
    } else {
      seenNames.add(key);
      names.push(key);
    }

    variables.push({
      name: key,
      lineNumber,
      hasValue,
      isExported,
    });
  }

  return {
    names,
    variables,
    duplicates: Array.from(duplicateNames),
    diagnostics,
  };
}

/**
 * Sanitizes a raw declaration line for diagnostic display without leaking values.
 * For example: "INVALID-KEY=my_secret_token" -> "INVALID-KEY=***"
 */
function sanitizeRawLine(line: string): string {
  const eqIndex = line.indexOf("=");
  if (eqIndex === -1) {
    return line;
  }
  const prefix = line.slice(0, eqIndex + 1);
  return `${prefix}***`;
}
