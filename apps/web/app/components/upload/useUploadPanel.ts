import type { MediaKind } from "@singology/shared";
import { type ChangeEvent, type SyntheticEvent, useEffect, useState } from "react";
import { useFetcher } from "react-router";

import type { MessageResult } from "../../lib/actionResult";
import { useActionNotification } from "../../lib/useActionNotification";

/** Simulated upload: this many percent per tick. */
const PROGRESS_STEP = 8;
const PROGRESS_TICK_MS = 80;

export type UploadPayload = Readonly<Record<string, string | number>>;

export interface PickedFile {
  file: File;
  /** Object URL for local playback; revoked when the pick changes or the panel unmounts. */
  url: string;
  kind: MediaKind;
}

export interface UploadPanelOptions {
  successTitle: string;
  fields?: Readonly<Record<string, string>>;
  action?: string;
  fetcherKey?: string;
}

export interface UploadPanelState {
  picked: PickedFile | null;
  inputKey: number;
  durationSec: number | null;
  playable: boolean;
  note: string;
  uploading: boolean;
  progress: number;
  result: MessageResult | undefined;
  busy: boolean;
  setNote: (note: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => void;
  onPreviewError: () => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function buildUploadPayload(
  file: Pick<File, "name" | "size" | "type">,
  durationSec: number,
  note: string,
  fields: Readonly<Record<string, string>> = {},
): UploadPayload {
  return {
    ...fields,
    fileName: file.name,
    sizeBytes: file.size,
    durationSec,
    mimeType: file.type,
    note,
  };
}

export function useUploadPanel({
  successTitle,
  fields,
  action,
  fetcherKey,
}: UploadPanelOptions): UploadPanelState {
  const fetcher = useFetcher<MessageResult>({ key: fetcherKey });
  const { submit } = fetcher;

  const [picked, setPicked] = useState<PickedFile | null>(null);
  // Remounts the file input so "Upload another" clears it.
  const [inputKey, setInputKey] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [playable, setPlayable] = useState(true);
  const [note, setNote] = useState("");
  // The metadata being "uploaded"; non-null while the simulated progress runs.
  const [pending, setPending] = useState<UploadPayload | null>(null);
  const [progress, setProgress] = useState(0);

  const result = useActionNotification(fetcher, successTitle);

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
    setPending(buildUploadPayload(picked.file, durationSec, note, fields));
  }

  function onReset() {
    fetcher.reset();
    setPicked(null);
    setInputKey((key) => key + 1);
    setDurationSec(null);
    setNote("");
    setProgress(0);
  }

  return {
    picked,
    inputKey,
    durationSec,
    playable,
    note,
    uploading: pending !== null,
    progress,
    result,
    busy: pending !== null || fetcher.state !== "idle",
    setNote,
    onFileChange,
    onLoadedMetadata,
    onPreviewError: () => setPlayable(false),
    onSubmit,
    onReset,
  };
}
