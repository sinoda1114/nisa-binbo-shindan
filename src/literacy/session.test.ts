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

  it("restarts from the result and drops it", () => {
    const finished = chooseAll(initialScreen());
    expect(finished.kind).toBe("result");
    if (finished.kind !== "result") {
      return;
    }
    expect(reduce(finished, { type: "restart" })).toEqual({ kind: "intro" });
  });
});
