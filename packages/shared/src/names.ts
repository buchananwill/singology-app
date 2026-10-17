export function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}
