import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/core/parser.js";

describe("parseEnv", () => {
  it("parses expected valid environment variables", () => {
    const content = `
PORT=3000
DATABASE_URL=postgresql://localhost:5432/db
APP_ENV=production
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["PORT", "DATABASE_URL", "APP_ENV"]);
    expect(result.diagnostics).toEqual([]);
    expect(result.duplicates).toEqual([]);
    expect(result.variables).toHaveLength(3);
    expect(result.variables[0]).toEqual({
      name: "PORT",
      lineNumber: 2,
      hasValue: true,
      isExported: false,
    });
  });

  it("handles empty files and whitespace-only files", () => {
    expect(parseEnv("").names).toEqual([]);
    expect(parseEnv("   \n\n\t  \n").names).toEqual([]);
    expect(parseEnv("").diagnostics).toEqual([]);
  });

  it("ignores comments and blank lines, including comments with leading whitespace", () => {
    const content = `
# Header comment
DB_HOST=localhost

  # Indented comment
    # Another comment
DB_PORT=5432
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["DB_HOST", "DB_PORT"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("handles values containing '=' correctly", () => {
    const content = `
CONNECTION_STRING=postgres://user:pass@host/db?ssl=true&opts=1
BASE64_SECRET=aGVsbG89d29ybGQ=
EQUALS===
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["CONNECTION_STRING", "BASE64_SECRET", "EQUALS"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("supports 'export KEY=value' syntax", () => {
    const content = `
export NODE_ENV=test
export API_KEY=secret_key
export\tPORT=8080
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["NODE_ENV", "API_KEY", "PORT"]);
    expect(result.variables.every((v) => v.isExported)).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it("preserves variable names that begin with 'export'", () => {
    const content = `
EXPORT_ENABLED=true
EXPORTER_PORT=9090
export_token=abc
export EXPORT_PATH=/tmp
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["EXPORT_ENABLED", "EXPORTER_PORT", "export_token", "EXPORT_PATH"]);
    expect(result.variables[0]?.isExported).toBe(false);
    expect(result.variables[3]?.isExported).toBe(true);
  });

  it("tracks duplicate variable declarations", () => {
    const content = `
PORT=3000
PORT=4000
DEBUG=false
DEBUG=true
PORT=5000
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["PORT", "DEBUG"]);
    expect(result.duplicates).toEqual(["PORT", "DEBUG"]);
    expect(result.variables).toHaveLength(5);
  });

  it("distinguishes empty values from present values", () => {
    const content = `
DEFINED_EMPTY=
DEFINED_WHITESPACE=   
DEFINED_WITH_VALUE=123
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["DEFINED_EMPTY", "DEFINED_WHITESPACE", "DEFINED_WITH_VALUE"]);
    expect(result.variables.find((v) => v.name === "DEFINED_EMPTY")?.hasValue).toBe(false);
    expect(result.variables.find((v) => v.name === "DEFINED_WHITESPACE")?.hasValue).toBe(false);
    expect(result.variables.find((v) => v.name === "DEFINED_WITH_VALUE")?.hasValue).toBe(true);
  });

  it("produces structured diagnostics for missing '=' without exposing secrets", () => {
    const content = `
VALID_KEY=test
INVALID_DECLARATION
ANOTHER_VALID=123
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["VALID_KEY", "ANOTHER_VALID"]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.lineNumber).toBe(3);
    expect(result.diagnostics[0]?.message).toBe("Missing '=' delimiter in declaration");
    expect(result.diagnostics[0]?.rawLine).toBe("INVALID_DECLARATION");
  });

  it("produces structured diagnostics for empty variable names", () => {
    const content = `
=some_value
  =other_value
`;
    const result = parseEnv(content);
    expect(result.names).toEqual([]);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]?.message).toBe("Empty variable name");
    // Ensure rawLine masks the value
    expect(result.diagnostics[0]?.rawLine).toBe("=***");
  });

  it("produces structured diagnostics for invalid identifiers without exposing secret values", () => {
    const content = `
123_INVALID=super_secret_value
INVALID-HYPHEN=another_secret
VALID_KEY=safe
`;
    const result = parseEnv(content);
    expect(result.names).toEqual(["VALID_KEY"]);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]?.message).toContain("Invalid variable name identifier");
    expect(result.diagnostics[0]?.rawLine).toBe("123_INVALID=***");
    expect(result.diagnostics[1]?.rawLine).toBe("INVALID-HYPHEN=***");
    // Value must not leak
    expect(JSON.stringify(result)).not.toContain("super_secret_value");
    expect(JSON.stringify(result)).not.toContain("another_secret");
  });

  it("handles CRLF Windows line endings seamlessly", () => {
    const content = "PORT=3000\r\nDATABASE_URL=postgres://...\r\nAPI_KEY=test\r\n";
    const result = parseEnv(content);
    expect(result.names).toEqual(["PORT", "DATABASE_URL", "API_KEY"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("handles quoted values and values without trailing newline", () => {
    const content = 'NAME="EnvGuard CLI"\nDESCRIPTION=\'A lightweight validator\'\nUNQUOTED=plain';
    const result = parseEnv(content);
    expect(result.names).toEqual(["NAME", "DESCRIPTION", "UNQUOTED"]);
    expect(result.variables.every((v) => v.hasValue)).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it("handles unicode and unusual characters in values without affecting key extraction", () => {
    const content = "UNICODE_KEY=hello_🚀_world\nI18N_MSG=こんにちは\nACCENT=café";
    const result = parseEnv(content);
    expect(result.names).toEqual(["UNICODE_KEY", "I18N_MSG", "ACCENT"]);
    expect(result.diagnostics).toEqual([]);
  });
});

