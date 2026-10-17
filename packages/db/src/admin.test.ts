import type * as Fs from "node:fs";

import type * as SupabaseJs from "@supabase/supabase-js";
import type Pg from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<typeof Fs>()),
  existsSync: (...args: unknown[]) => {
    io.calls.push(`existsSync ${String(args[0])}`);
    return false;
  },
  readFileSync: (...args: unknown[]) => {
    io.calls.push(`readFileSync ${String(args[0])}`);
    return "";
  },
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => ({
  ...(await importOriginal<typeof SupabaseJs>()),
  createClient: () => {
    io.calls.push("createClient");
    throw new Error("no client at import");
  },
}));

vi.mock("pg", async (importOriginal) => {
  const pg = (await importOriginal<{ default: typeof Pg }>()).default;
  class Pool extends pg.Pool {
    constructor(...args: ConstructorParameters<typeof pg.Pool>) {
      io.calls.push("Pool");
      super(...args);
    }
  }
  return { default: { ...pg, Pool } };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("@singology/db/admin", () => {
  // The Worker bundles this entry: loading it must not read env files, resolve file URLs,
  // open a pool or build a Supabase client.
  it("loads without I/O, whatever the environment says", async () => {
    vi.stubEnv("SINGOLOGY_ENV", "not-an-env");
    vi.stubEnv("DATABASE_URL", "");
    class RecordingUrl extends URL {
      constructor(url: string | URL, base?: string | URL) {
        if (base !== undefined && String(base).startsWith("file:")) {
          io.calls.push(`new URL(${String(url)}, file:)`);
        }
        super(url, base);
      }
    }
    vi.stubGlobal("URL", RecordingUrl);
    vi.resetModules();
    const admin = await import("./admin");
    vi.unstubAllGlobals();
    expect(admin.createNotificationQueue).toBeTypeOf("function");
    expect(io.calls).toEqual([]);
  });
});
