import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { assertTestEnv, envValues } from "./env";

const dirs: string[] = [];

function envDir(files: Record<string, string>): URL {
  const dir = mkdtempSync(path.join(tmpdir(), "singology-env-"));
  dirs.push(dir);
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), contents);
  }
  return pathToFileURL(`${dir}${path.sep}`);
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true });
  }
});

describe("envValues", () => {
  it("refuses a missing .env.test rather than falling back to the inherited environment", () => {
    vi.stubEnv("DATABASE_URL", "postgres://inherited");
    expect(() => envValues("test", envDir({ ".env": "DATABASE_URL=postgres://dev" }))).toThrow(
      /\.env\.test, which is missing/,
    );
  });

  it("reads only .env.test in test mode", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "inherited");
    const values = envValues("test", envDir({ ".env.test": "DATABASE_URL=postgres://test" }));
    expect(values.DATABASE_URL).toBe("postgres://test");
    expect(values.SUPABASE_SECRET_KEY).toBeUndefined();
  });

  it("lets .env win over the inherited environment in dev mode, which stays the fallback", () => {
    vi.stubEnv("DATABASE_URL", "postgres://inherited");
    vi.stubEnv("SUPABASE_SECRET_KEY", "inherited");
    const values = envValues("dev", envDir({ ".env": "DATABASE_URL=postgres://dev" }));
    expect(values.DATABASE_URL).toBe("postgres://dev");
    expect(values.SUPABASE_SECRET_KEY).toBe("inherited");
    expect(envValues("dev", envDir({})).SUPABASE_SECRET_KEY).toBe("inherited");
  });
});

describe("assertTestEnv", () => {
  it("passes only when SINGOLOGY_ENV=test", () => {
    vi.stubEnv("SINGOLOGY_ENV", "test");
    expect(() => assertTestEnv()).not.toThrow();
    vi.stubEnv("SINGOLOGY_ENV", "");
    expect(() => assertTestEnv()).toThrow(/SINGOLOGY_ENV=test/);
  });
});
