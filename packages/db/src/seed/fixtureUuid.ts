import { createHash } from "node:crypto";

// A fixed namespace, so a fixture id maps to the same uuid on every seed run (RFC 9562 version 5).
const NAMESPACE = Buffer.from("5f0b6d0e8c1a4b7e9d3f2a6c4e8b1d70", "hex");

/** The stable primary key for a fixture id such as `lib-breath-hiss`; the seed upserts on it. */
export function fixtureUuid(fixtureId: string): string {
  const hash = createHash("sha1").update(NAMESPACE).update(fixtureId).digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
