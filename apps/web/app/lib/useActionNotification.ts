import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Fetcher } from "react-router";

import type { MessageResult } from "./actionResult";

/** Returns the fetcher's result once it is idle, after announcing a success. */
export function useActionNotification<Result extends MessageResult>(
  fetcher: Fetcher<Result>,
  successTitle: string,
): Result | undefined {
  const { data } = fetcher;
  useEffect(() => {
    if (data?.ok === true) {
      notifications.show({ color: "green", title: successTitle, message: data.message });
    }
  }, [data, successTitle]);
  return fetcher.state === "idle" ? data : undefined;
}
