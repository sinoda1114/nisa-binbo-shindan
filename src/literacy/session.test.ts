import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./quiz";
import { initialScreen, reduce, type Event } from "./session";
import type { Answers } from "./types";

const SOLID: Answers = {
  purchasingPower: "real-can-fall",
  compound: "on-interest",
  depositCover: "capped-yen",
  accountFiling: "withholding-optional",
  returnOfCapital: "reduces-basis",
  nisaHolding: "unlimited",
  pensionDeferral: "rises-monthly",
  tsumitate: "not-guaranteed",
  trustFee: "ongoing",
};

function chooseAll(start: ReturnType<typeof initialScreen>): ReturnType<typeof reduce> {
  let screen = reduce(start, { type: "start" });
  const fields = Object.keys(SOLID) as (keyof Answers)[];
  for (const field of fields) {
    const event = {
      type: "choose",
      field,
      value: SOLID[field],
    } as Event;
    screen = reduce(screen, event);
  }
  return screen;
}

describe("literacy session", () => {
  it("walks from the intro through every question to a result", () => {
    const started = reduce(initialScreen(), { type: "start" });
    expect(started).toEqual({ kind: "question", index: 0, answers: {} });

    const finished = chooseAll(initialScreen());
    expect(finished.kind).toBe("result");
    if (finished.kind !== "result") {
      return;
    }
    expect(finished.shareOpen).toBe(false);
    expect(finished.diagnosis.verdict).toBe("solid");
    expect(finished.answers).toEqual(SOLID);
  });

  it("returns to the intro from the first question and keeps answers when going back", () => {
    const started = reduce(initialScreen(), { type: "start" });
    expect(reduce(started, { type: "back" })).toEqual({ kind: "intro" });

    const first = QUESTIONS[0];
    if (!first || first.field !== "purchasingPower") {
      throw new Error("設問の先頭が購買力ではありません");
    }
    const answered = reduce(started, {
      type: "choose",
      field: "purchasingPower",
      value: "real-can-fall",
    });
    const back = reduce(answered, { type: "back" });
    expect(back).toEqual({
      kind: "question",
      index: 0,
      answers: { purchasingPower: "real-can-fall" },
    });
  });

  it("opens and closes the share list without changing the diagnosis", () => {
    const finished = chooseAll(initialScreen());
    const opened = reduce(finished, { type: "toggleShare" });
    expect(opened.kind).toBe("result");
    if (opened.kind !== "result" || finished.kind !== "result") {
      return;
    }
    expect(opened.shareOpen).toBe(true);
    expect(opened.diagnosis).toBe(finished.diagnosis);
    const noted = reduce(opened, { type: "markCopy", note: "copied" });
    if (noted.kind !== "result") {
      return;
    }
    expect(noted.copyNote).toBe("copied");
    expect(noted.shareOpen).toBe(true);
    const closed = reduce(noted, { type: "toggleShare" });
    if (closed.kind !== "result") {
      return;
    }
    expect(closed.shareOpen).toBe(false);
    expect(closed.copyNote).toBe("idle");
    expect(reduce(closed, { type: "restart" })).toEqual({ kind: "intro" });
  });

  it("ignores share actions before the result", () => {
    const intro = initialScreen();
    expect(reduce(intro, { type: "toggleShare" })).toBe(intro);
    expect(reduce(intro, { type: "markCopy", note: "failed" })).toBe(intro);
  });
});
