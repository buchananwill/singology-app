/** An error handler that does not handle: for callers with nothing to keep if cleanup fails. */
export function rethrow(error: unknown): never {
  throw error;
}

export function firstOrThrow<T>(rows: readonly T[], message: string): T {
  const [first] = rows;
  if (first === undefined) {
    throw new Error(message);
  }
  return first;
}

export function getOrThrow<K, V>(map: ReadonlyMap<K, V>, key: K, message: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}
