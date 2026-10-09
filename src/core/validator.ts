import type { ParseResult } from "./parser.js";

export interface ValidationItem {
  name: string;
  isMissing: boolean;
  hasValueInTarget: boolean;
}

export interface ValidationResult {
  /**
   * Distinct variable names defined in the example configuration.
   */
  expected: string[];
  /**
   * Distinct variable names defined in the target configuration.
   */
  actual: string[];
  /**
   * Variables that are present in expected but missing from actual.
   */
  missing: string[];
  /**
   * Number of expected variables that were found in actual.
   */
  passed: number;
  /**
   * Detailed breakdown for each expected variable.
   */
  items: ValidationItem[];
  /**
   * Whether all expected variables are present in actual.
   */
  isValid: boolean;
  /**
   * Diagnostics from parsing the expected file.
   */
  expectedDiagnostics: ParseResult["diagnostics"];
  /**
   * Diagnostics from parsing the actual file.
   */
  actualDiagnostics: ParseResult["diagnostics"];
}

/**
 * Validates environment configuration by comparing expected (.env.example) and actual (.env) parse results.
 * In Stage 3, validation checks for presence in the target environment file.
 * The internal data model also tracks whether target variables have non-empty values.
 */
export function validateEnv(
  expectedParse: ParseResult,
  actualParse: ParseResult
): ValidationResult {
  const expected = expectedParse.names;
  const actual = actualParse.names;

  // Build a lookup map of actual variables to check presence and value status
  const actualMap = new Map<string, boolean>();
  for (const v of actualParse.variables) {
    // If multiple declarations exist, consider non-empty if at least one has a value
    const existing = actualMap.get(v.name);
    actualMap.set(v.name, existing === true || v.hasValue);
  }

  const missing: string[] = [];
  const items: ValidationItem[] = [];

  for (const name of expected) {
    const isPresent = actualMap.has(name);
    if (!isPresent) {
      missing.push(name);
      items.push({
        name,
        isMissing: true,
        hasValueInTarget: false,
      });
    } else {
      items.push({
        name,
        isMissing: false,
        hasValueInTarget: actualMap.get(name) ?? false,
      });
    }
  }

  const passed = expected.length - missing.length;
  const isValid = missing.length === 0;

  return {
    expected,
    actual,
    missing,
    passed,
    items,
    isValid,
    expectedDiagnostics: expectedParse.diagnostics,
    actualDiagnostics: actualParse.diagnostics,
  };
}
