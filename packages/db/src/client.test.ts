import { describe, expect, it } from "vitest";

import { connectionSettingsFromUrl } from "./client";

describe("connectionSettingsFromUrl", () => {
  it("decodes a percent-encoded user and password", () => {
    expect(
      connectionSettingsFromUrl(
        "postgresql://postgres.abcdef:p%40ss%3Aw%2Frd@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
      ),
    ).toEqual({
      host: "aws-0-eu-west-1.pooler.supabase.com",
      port: 5432,
      user: "postgres.abcdef",
      password: "p@ss:w/rd",
      database: "postgres",
    });
  });

  it("defaults the port and the database", () => {
    const settings = connectionSettingsFromUrl("postgres://u:p@db.example.com");
    expect(settings.port).toBe(5432);
    expect(settings.database).toBe("postgres");
  });
});
