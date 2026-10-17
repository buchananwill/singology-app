import { reseedTestProject } from "../../src/admin";

export default async function setup(): Promise<void> {
  await reseedTestProject();
}
