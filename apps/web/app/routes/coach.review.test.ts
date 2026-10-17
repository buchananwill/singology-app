import { createFixtureRepositories } from "@singology/db";
import type { SendFeedback } from "@singology/shared";
import { RouterContextProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { routeArgs } from "../../test/routeArgs";
import { coachIdContext, repositoriesContext } from "../context";
import type { Route } from "./+types/coach.review";
import { action } from "./coach.review";

const send: SendFeedback = {
  intent: "send",
  summary: "Steadier already.",
  comments: [{ tSeconds: 4, body: "Keep the ribs wide." }],
  reply: null,
  assignLibraryItemIds: [],
};

function actionArgs(context: RouterContextProvider, submissionId: string): Route.ActionArgs {
  const request = new Request(`http://localhost/coach/reviews/${submissionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(send),
  });
  return routeArgs(context, request, "/coach/reviews/:submissionId", { submissionId });
}

describe("the review action", () => {
  it("refuses a second send on a reviewed take with 409, before anything is written", async () => {
    const repositories = createFixtureRepositories({ now: new Date("2026-10-17T12:00:00Z") });
    const sendSpy = vi.spyOn(repositories.feedback, "send");
    const recordSpy = vi.spyOn(repositories.events, "record");
    const context = new RouterContextProvider();
    context.set(repositoriesContext, repositories);
    context.set(coachIdContext, "coach-founder");

    const result = await action(actionArgs(context, "sub-ben-hiss-1"));

    expect(result.init?.status).toBe(409);
    expect(result.data).toEqual({ ok: false, error: "This take already has feedback." });
    expect(sendSpy).not.toHaveBeenCalled();
    expect(recordSpy).not.toHaveBeenCalled();
  });
});
