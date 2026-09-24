import { Box, Button, Group, Progress, Stack, Text, Textarea } from "@mantine/core";
import type { SyntheticEvent } from "react";

import { formatBytes, formatDuration } from "../../lib/format";
import { VIDEO_PROPS } from "../videoProps";
import type { PickedFile } from "./useUploadPanel";

export interface PickedFilePanelProps {
  picked: PickedFile;
  durationSec: number | null;
  playable: boolean;
  note: string;
  /** Omit to hide the note field. */
  noteLabel?: string;
  uploading: boolean;
  progress: number;
  error: string | null;
  busy: boolean;
  submitLabel: string;
  setNote: (note: string) => void;
  onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => void;
  onPreviewError: () => void;
  onSubmit: () => void;
}

export function PickedFilePanel({
  picked,
  durationSec,
  playable,
  note,
  noteLabel,
  uploading,
  progress,
  error,
  busy,
  submitLabel,
  setNote,
  onLoadedMetadata,
  onPreviewError,
  onSubmit,
}: PickedFilePanelProps) {
  const previewProps = {
    src: picked.url,
    controls: true,
    preload: "metadata",
    onLoadedMetadata,
    onError: onPreviewError,
    "data-testid": "upload-preview",
  } as const;

  return (
    <Stack gap="sm" data-testid="upload-file">
      <Group gap="lg" wrap="wrap">
        <Text size="sm" data-testid="upload-file-name" style={{ wordBreak: "break-all" }}>
          <strong>File:</strong> {picked.file.name}
        </Text>
        <Text size="sm" data-testid="upload-file-size">
          <strong>Size:</strong> {formatBytes(picked.file.size)}
        </Text>
        <Text size="sm" data-testid="upload-file-duration">
          <strong>Length:</strong>{" "}
          {durationSec !== null ? formatDuration(durationSec) : playable ? "reading…" : "unknown"}
        </Text>
      </Group>
      {picked.kind === "video" ? (
        <Box component="video" {...VIDEO_PROPS} mah={320} {...previewProps} />
      ) : (
        <Box component="audio" w="100%" {...previewProps} />
      )}
      {!playable && (
        <Text size="sm" c="red" role="alert">
          This file can't be played in the browser. Try a different recording.
        </Text>
      )}
      {noteLabel !== undefined && (
        <Textarea
          label={noteLabel}
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          maxLength={1000}
          autosize
          minRows={2}
          disabled={busy}
        />
      )}
      {uploading && (
        <Progress
          value={progress}
          aria-label="Upload progress"
          data-testid="upload-progress"
          animated
        />
      )}
      {error !== null && (
        <Text size="sm" c="red" role="alert">
          {error}
        </Text>
      )}
      <Box>
        <Button onClick={onSubmit} disabled={durationSec === null} loading={busy}>
          {submitLabel}
        </Button>
      </Box>
    </Stack>
  );
}
