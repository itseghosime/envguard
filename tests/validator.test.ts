import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/core/parser.js";
import { validateEnv } from "../src/core/validator.js";

describe("validateEnv", () => {
  it("passes when all expected variables exist", () => {
    const expected = parseEnv("PORT=3000\nDATABASE_URL=\nAPI_KEY=");
    const actual = parseEnv("PORT=8080\nDATABASE_URL=postgres://...\nAPI_KEY=key");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.passed).toBe(3);
    expect(result.expected).toEqual(["PORT", "DATABASE_URL", "API_KEY"]);
  });

  it("identifies when exactly one variable is missing", () => {
    const expected = parseEnv("PORT=\nDATABASE_URL=\nAPI_KEY=");
    const actual = parseEnv("PORT=3000\nAPI_KEY=key");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(["DATABASE_URL"]);
    expect(result.passed).toBe(2);
  });

  it("identifies when multiple variables are missing", () => {
    const expected = parseEnv("VAR_A=\nVAR_B=\nVAR_C=\nVAR_D=");
    const actual = parseEnv("VAR_B=1");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(["VAR_A", "VAR_C", "VAR_D"]);
    expect(result.passed).toBe(1);
  });

  it("identifies when all variables are missing", () => {
    const expected = parseEnv("FOO=\nBAR=\nBAZ=");
    const actual = parseEnv("");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(["FOO", "BAR", "BAZ"]);
    expect(result.passed).toBe(0);
  });

  it("handles empty expected configuration gracefully", () => {
    const expected = parseEnv("");
    const actual = parseEnv("FOO=1\nBAR=2");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.passed).toBe(0);
    expect(result.expected).toEqual([]);
  });

  it("preserves order of expected variables", () => {
    const expected = parseEnv("ZEBRA=\nAPPLE=\nMANGO=\nBANANA=");
    const actual = parseEnv("BANANA=1\nAPPLE=2");

    const result = validateEnv(expected, actual);

    expect(result.expected).toEqual(["ZEBRA", "APPLE", "MANGO", "BANANA"]);
    expect(result.missing).toEqual(["ZEBRA", "MANGO"]);
  });

  it("distinguishes missing variables from variables with empty values in the internal model", () => {
    const expected = parseEnv("VAR_MISSING=\nVAR_EMPTY=\nVAR_FILLED=");
    const actual = parseEnv("VAR_EMPTY=\nVAR_FILLED=present_value");

    const result = validateEnv(expected, actual);

    // In Stage 3, presence-only validation means VAR_EMPTY is NOT missing
    expect(result.missing).toEqual(["VAR_MISSING"]);
    expect(result.isValid).toBe(false);

    // Verify internal tracking
    const emptyItem = result.items.find((i) => i.name === "VAR_EMPTY");
    const filledItem = result.items.find((i) => i.name === "VAR_FILLED");
    const missingItem = result.items.find((i) => i.name === "VAR_MISSING");

    expect(emptyItem?.isMissing).toBe(false);
    expect(emptyItem?.hasValueInTarget).toBe(false);

    expect(filledItem?.isMissing).toBe(false);
    expect(filledItem?.hasValueInTarget).toBe(true);

    expect(missingItem?.isMissing).toBe(true);
    expect(missingItem?.hasValueInTarget).toBe(false);
  });

  it("handles duplicate expected declarations deduplicating cleanly", () => {
    const expected = parseEnv("DUP=1\nDUP=2\nUNIQUE=3");
    const actual = parseEnv("DUP=hello");

    const result = validateEnv(expected, actual);

    expect(result.expected).toEqual(["DUP", "UNIQUE"]);
    expect(result.missing).toEqual(["UNIQUE"]);
    expect(result.passed).toBe(1);
  });

  it("passes when target .env contains extra variables not listed in .env.example", () => {
    const expected = parseEnv("PORT=3000\nDATABASE_URL=");
    const actual = parseEnv("PORT=3000\nDATABASE_URL=postgres://...\nEXTRA_SECRET=foo\nANOTHER_EXTRA=bar");

    const result = validateEnv(expected, actual);

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.passed).toBe(2);
    expect(result.actual).toContain("EXTRA_SECRET");
    expect(result.actual).toContain("ANOTHER_EXTRA");
  });
});

