export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/** The items with these ids, in the order given; unknown ids are omitted. */
export function pickByIds<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[],
): T[] {
  const byId = indexById(items);
  return ids.flatMap((id) => byId.get(id) ?? []);
}
