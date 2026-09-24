import { Button, Group, Stack, TextInput } from "@mantine/core";
import { type Dispatch, type FormEvent, useState } from "react";

import { formatTimestamp } from "../../lib/format";
import { useHydrated } from "../../lib/useHydrated";
import { usePlayer } from "../player/PlayerProvider";
import type { ReviewEvent, ReviewState } from "./reviewReducer";

export interface AddCommentProps {
  draft: ReviewState["draft"];
  dispatch: Dispatch<ReviewEvent>;
}

/** Render inside the take's `PlayerProvider`. */
export function AddComment({ draft, dispatch }: AddCommentProps) {
  const { handle } = usePlayer();
  const hydrated = useHydrated();
  const [body, setBody] = useState("");

  function onOpen() {
    handle.pause();
    setBody("");
    dispatch({ type: "openDraft", tSeconds: handle.getCurrentTime() });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: "addComment", body });
    setBody("");
  }

  if (draft === null) {
    return (
      <Group>
        <Button variant="light" onClick={onOpen} disabled={!hydrated}>
          Add comment at current time
        </Button>
      </Group>
    );
  }

  return (
    <form onSubmit={onSubmit} data-testid="comment-draft-form">
      <Stack gap="xs">
        <TextInput
          label={`Comment at ${formatTimestamp(draft.tSeconds)}`}
          placeholder="What should the student listen for here?"
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          maxLength={500}
          autoFocus
          data-testid="comment-draft"
        />
        <Group gap="xs">
          <Button type="submit" size="sm" disabled={body.trim() === ""}>
            Add comment
          </Button>
          <Button size="sm" variant="subtle" onClick={() => dispatch({ type: "cancelDraft" })}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
