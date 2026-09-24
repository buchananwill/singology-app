import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Input,
  List,
  Progress,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { MediaKind } from "@singology/shared";
import { type ChangeEvent, type SyntheticEvent, useEffect, useId, useState } from "react";
import { useFetcher } from "react-router";

import type { MessageResult } from "../../lib/actionResult";
import { formatBytes, formatDuration } from "../../lib/format";
import { useHydrated } from "../../lib/useHydrated";

/** Simulated upload: this many percent per tick. */
const PROGRESS_STEP = 8;
const PROGRESS_TICK_MS = 80;

/** What the panel posts as JSON: the picked file's metadata plus the page's extra fields. */
type UploadPayload = Readonly<Record<string, string | number>>;

interface PickedFile {
  file: File;
  /** Object URL for local playback; revoked when the pick changes or the panel unmounts. */
  url: string;
  kind: MediaKind;
}

export interface UploadPanelProps {
  /** Heading above the panel, e.g. "Upload your take". */
  title: string;
  /** Label of the submit button, e.g. "Send to your coach". */
  submitLabel: string;
  /** Title of the success notification and alert. */
  successTitle: string;
  /** Label of the optional note field; omit to hide the field. */
  noteLabel?: string;
  /** Extra fields posted with the metadata, e.g. `{ libraryItemId }`. */
  fields?: Readonly<Record<string, string>>;
  /** Route to post to; defaults to the current route's action. */
  action?: string;
  /**
   * Shares the panel's fetcher under this key, so the page can read the
   * action's result with `useFetcher({ key })`.
   */
  fetcherKey?: string;
}

/**
 * The upload panel (spec decision 19). The visitor picks an audio or video
 * file; the panel shows its name, size and duration and plays it back in a
 * plain media element (no waveform decode of local files). Submit runs a
 * simulated progress bar, then posts only the file's metadata to the route
 * action (decision 11). The file never leaves the browser.
 */
export function UploadPanel({
  title,
  submitLabel,
  successTitle,
  noteLabel,
  fields,
  action,
  fetcherKey,
}: UploadPanelProps) {
  const inputId = useId();
  const hydrated = useHydrated();
  const fetcher = useFetcher<MessageResult>({ key: fetcherKey });
  const { submit } = fetcher;

  const [picked, setPicked] = useState<PickedFile | null>(null);
  /** Remounts the file input so "Upload another" clears it. */
  const [inputKey, setInputKey] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [playable, setPlayable] = useState(true);
  const [note, setNote] = useState("");
  /** The metadata being "uploaded"; non-null while the simulated progress runs. */
  const [pending, setPending] = useState<UploadPayload | null>(null);
  const [progress, setProgress] = useState(0);

  const result = fetcher.state === "idle" ? fetcher.data : undefined;
  const succeeded = result?.ok === true;
  const busy = pending !== null || fetcher.state !== "idle";

  useEffect(() => {
    if (picked === null) {
      return;
    }
    const { url } = picked;
    return () => URL.revokeObjectURL(url);
  }, [picked]);

  // The simulated upload: tick the progress bar to 100%, then call the action.
  useEffect(() => {
    if (pending === null) {
      return;
    }
    let value = 0;
    const timer = window.setInterval(() => {
      value = Math.min(100, value + PROGRESS_STEP);
      setProgress(value);
      if (value === 100) {
        window.clearInterval(timer);
        setPending(null);
        void submit(pending, { method: "post", action, encType: "application/json" });
      }
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [pending, submit, action]);

  useEffect(() => {
    if (fetcher.data?.ok === true) {
      notifications.show({ color: "green", title: successTitle, message: fetcher.data.message });
    }
  }, [fetcher.data, successTitle]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setDurationSec(null);
    setPlayable(true);
    setProgress(0);
    setPicked(
      file === undefined
        ? null
        : {
            file,
            url: URL.createObjectURL(file),
            kind: file.type.startsWith("video/") ? "video" : "audio",
          },
    );
  }

  function onLoadedMetadata(event: SyntheticEvent<HTMLMediaElement>) {
    const { duration } = event.currentTarget;
    setDurationSec(Number.isFinite(duration) ? duration : null);
  }

  function onSubmit() {
    if (picked === null || durationSec === null) {
      return;
    }
    setProgress(0);
    setPending({
      ...fields,
      fileName: picked.file.name,
      sizeBytes: picked.file.size,
      durationSec,
      mimeType: picked.file.type,
      note,
    });
  }

  function onReset() {
    fetcher.reset();
    setPicked(null);
    setInputKey((key) => key + 1);
    setDurationSec(null);
    setNote("");
    setProgress(0);
  }

  const previewProps = {
    src: picked?.url,
    controls: true,
    preload: "metadata",
    onLoadedMetadata,
    onError: () => setPlayable(false),
    "data-testid": "upload-preview",
  } as const;

  return (
    <Card withBorder padding="lg" data-testid="upload-panel">
      <Stack gap="md">
        <Title order={2} size="h3">
          {title}
        </Title>

        {succeeded ? (
          <Stack gap="sm">
            <Alert color="green" title={successTitle} data-testid="upload-success">
              {result.message}
            </Alert>
            <Box>
              <Button variant="light" onClick={onReset}>
                Upload another
              </Button>
            </Box>
          </Stack>
        ) : (
          <>
            <Input.Wrapper
              label="Choose a recording"
              description="An audio or video file from your phone or computer."
              id={inputId}
            >
              {/* No `capture` attribute, so iOS offers Photos, Camera and Files (decision 19). */}
              <input
                key={inputKey}
                id={inputId}
                type="file"
                accept="audio/*,video/*"
                onChange={onFileChange}
                disabled={!hydrated || busy}
                data-testid="upload-input"
                style={{ display: "block", marginTop: 6, maxWidth: "100%" }}
              />
            </Input.Wrapper>

            <Box c="dimmed" fz="sm">
              <Text size="sm" fw={600} c="dimmed">
                Recommended recorder
              </Text>
              <List size="sm">
                <List.Item>
                  iPhone: Voice Memos with Lossless turned on, or the Camera app.
                </List.Item>
                <List.Item>Android: the built-in voice recorder.</List.Item>
              </List>
            </Box>

            {picked !== null && (
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
                    {durationSec !== null
                      ? formatDuration(durationSec)
                      : playable
                        ? "reading…"
                        : "unknown"}
                  </Text>
                </Group>
                {picked.kind === "video" ? (
                  <Box
                    component="video"
                    playsInline
                    w="100%"
                    bg="black"
                    style={{ display: "block", maxHeight: 320 }}
                    {...previewProps}
                  />
                ) : (
                  <audio style={{ width: "100%" }} {...previewProps} />
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
                {pending !== null && (
                  <Progress
                    value={progress}
                    aria-label="Upload progress"
                    data-testid="upload-progress"
                    animated
                  />
                )}
                {result?.ok === false && (
                  <Text size="sm" c="red" role="alert">
                    {result.error}
                  </Text>
                )}
                <Box>
                  <Button onClick={onSubmit} disabled={durationSec === null} loading={busy}>
                    {submitLabel}
                  </Button>
                </Box>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
