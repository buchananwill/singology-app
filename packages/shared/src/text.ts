export function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

export function formatCount(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
