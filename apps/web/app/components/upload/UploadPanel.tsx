import { Box, Button, Card, Input, Stack, Title } from "@mantine/core";
import { useId } from "react";

import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import { PickedFilePanel } from "./PickedFilePanel";
import { RecorderTips } from "./RecorderTips";
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

            <RecorderTips />

            {picked !== null && (
              <PickedFilePanel
                picked={picked}
                durationSec={durationSec}
                playable={playable}
                note={note}
                noteLabel={noteLabel}
                uploading={uploading}
                progress={progress}
                error={result?.ok === false ? result.error : null}
                busy={busy}
                submitLabel={submitLabel}
                setNote={setNote}
                onLoadedMetadata={onLoadedMetadata}
                onPreviewError={onPreviewError}
                onSubmit={onSubmit}
              />
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
