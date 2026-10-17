import type { EventRepository } from "@singology/db";
import type { RecordEvent } from "@singology/shared";

// A user action never fails on its analytics row, so a failed insert is logged and swallowed.
export async function recordEventBestEffort(
  events: EventRepository,
  event: RecordEvent,
): Promise<void> {
  try {
    await events.record(event);
  } catch (error) {
    console.error(`${event.kind} event not recorded`, error);
  }
}
