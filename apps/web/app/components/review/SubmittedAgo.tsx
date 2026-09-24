import { formatSince } from "../../lib/format";
import { useNow } from "../../lib/useNow";

export interface SubmittedAgoProps {
  serverNow: number;
  submittedAt: string;
  turnaroundHours: number;
}

// Its own component, so the live clock re-renders only this text.
export function SubmittedAgo({ serverNow, submittedAt, turnaroundHours }: SubmittedAgoProps) {
  const now = useNow(serverNow);
  return formatSince(submittedAt, now, turnaroundHours);
}
