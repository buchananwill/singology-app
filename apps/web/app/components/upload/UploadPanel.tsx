import {
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
import { useId } from "react";

import { formatBytes, formatDuration } from "../../lib/format";
import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import { useUploadPanel } from "./useUploadPanel";

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
  const {
    picked,
    inputKey,
    durationSec,
    playable,
    note,
    uploading,
    progress,
    result,
    busy,
    setNote,
    onFileChange,
    onLoadedMetadata,
    onPreviewError,
    onSubmit,
    onReset,
  } = useUploadPanel({ successTitle, fields, action, fetcherKey });
  const succeeded = result?.ok === true;

  const previewProps = {
    src: picked?.url,
    controls: true,
    preload: "metadata",
    onLoadedMetadata,
    onError: onPreviewError,
    "data-testid": "upload-preview",
  } as const;

  return (
    <Card withBorder padding="lg" data-testid="upload-panel">
      <Stack gap="md">
        <Title order={2} size="h3">
          {title}
        </Title>

        {succeeded ? (
          <SuccessState title={successTitle} message={result.message} testId="upload-success">
            <Button variant="light" onClick={onReset}>
              Upload another
            </Button>
          </SuccessState>
        ) : (
          <>
            <Input.Wrapper
              label="Choose a recording"
              description="An audio or video file from your phone or computer."
              id={inputId}
            >
              {/* No `capture` attribute, so iOS offers Photos, Camera and Files (decision 19). */}
              <Box
                component="input"
                key={inputKey}
                id={inputId}
                type="file"
                accept="audio/*,video/*"
                onChange={onFileChange}
                disabled={!hydrated || busy}
                data-testid="upload-input"
                display="block"
                mt="xxs"
                maw="100%"
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
                    display="block"
                    mah={320}
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
                {uploading && (
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
