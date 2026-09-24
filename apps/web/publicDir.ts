import path from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public");
