import { Stack, Text } from "@mantine/core";
import type { CoachQueueItem } from "@singology/db";
import type { ReactNode } from "react";

import { CATEGORY_LABEL, MEDIA_KIND_LABEL } from "../../lib/format";

export interface QueueItemSummaryProps extends Pick<
  CoachQueueItem,
  "student" | "item" | "mediaKind"
> {
  studentTestId: string;
  children?: ReactNode;
}

export function QueueItemSummary({
  student,
  item,
  mediaKind,
  studentTestId,
  children,
}: QueueItemSummaryProps) {
  return (
    <Stack gap={0}>
      <Text fw={600} data-testid={studentTestId}>
        {student.displayName}
      </Text>
      <Text size="sm" c="dimmed">
        {item.title} · {CATEGORY_LABEL[item.category]} · {MEDIA_KIND_LABEL[mediaKind]}
      </Text>
      {children}
    </Stack>
  );
}
