import { Accordion, Stack, Text } from "@mantine/core";
import type { FeedbackComment, MediaAsset } from "@singology/shared";
import { useState } from "react";

import { formatDate } from "../../lib/format";
import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";

export interface PreviousTakeProps {
  submittedAt: string;
  note: string;
  asset: MediaAsset;
  /** The comments given on that take, if it was reviewed. */
  comments: readonly FeedbackComment[];
}

const PANEL = "previous";

/**
 * The student's previous take of the same exercise, collapsed by default
 * (decision 16). It has its own `PlayerProvider`, and its player mounts only
 * when the panel is open, so wavesurfer never draws into a hidden container.
 */
export function PreviousTake({ submittedAt, note, asset, comments }: PreviousTakeProps) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Accordion variant="contained" value={open} onChange={setOpen} data-testid="previous-take">
      <Accordion.Item value={PANEL}>
        <Accordion.Control>Previous take: {formatDate(submittedAt)}</Accordion.Control>
        <Accordion.Panel>
          {open === PANEL && (
            <Stack gap="sm">
              {note !== "" && (
                <Text size="sm">
                  <strong>Note then:</strong> {note}
                </Text>
              )}
              <StandalonePlayer asset={asset} comments={comments} label="Previous take" height={64}>
                {comments.length > 0 && <CommentList comments={comments} />}
              </StandalonePlayer>
            </Stack>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
