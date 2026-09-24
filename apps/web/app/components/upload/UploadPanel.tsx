import { Box, Button, Card, Input, Stack, Title } from "@mantine/core";
import { useId } from "react";

import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import { PickedFilePanel } from "./PickedFilePanel";
import { RecorderTips } from "./RecorderTips";
import { useUploadPanel } from "./useUploadPanel";

export interface UploadPanelProps {
  title: string;
  submitLabel: string;
  successTitle: string;
  /** Omit to hide the note field. */
  noteLabel?: string;
  /** Posted with the metadata, e.g. `{ libraryItemId }`. */
  fields?: Readonly<Record<string, string>>;
  /** Defaults to the current route's action. */
  action?: string;
  /** Lets the page read the action's result with `useFetcher({ key })`. */
  fetcherKey?: string;
}

/** Posts only the picked file's metadata: the file never leaves the browser. */
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
              {/* No `capture` attribute, so iOS offers Photos, Camera and Files. */}
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
