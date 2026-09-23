import { diagnose } from "./diagnose";
import { QUESTIONS, isComplete } from "./quiz";
import type { Answers, Diagnosis } from "./types";

export type Screen =
  | { kind: "intro" }
  | { kind: "question"; index: number; answers: Partial<Answers> }
  | {
      kind: "result";
      answers: Answers;
      diagnosis: Diagnosis;
    };

export type ChooseEvent = {
  [Field in keyof Answers]: {
    type: "choose";
    field: Field;
    value: Answers[Field];
  };
}[keyof Answers];

export type Event =
  | { type: "start" }
  | { type: "back" }
  | { type: "restart" }
  | ChooseEvent;

export function initialScreen(): Screen {
  return { kind: "intro" };
}

export function reduce(current: Screen, event: Event): Screen {
  switch (event.type) {
    case "start":
      return { kind: "question", index: 0, answers: {} };
    case "restart":
      return { kind: "intro" };
    case "back":
      return goBack(current);
    case "choose":
      return applyChoice(current, event);
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

function goBack(current: Screen): Screen {
  if (current.kind !== "question") {
    return current;
  }
  if (current.index === 0) {
    return { kind: "intro" };
  }
  return {
    kind: "question",
    index: current.index - 1,
    answers: current.answers,
  };
}

function applyChoice(current: Screen, event: ChooseEvent): Screen {
  if (current.kind !== "question") {
    return current;
  }
  const answers = { ...current.answers, [event.field]: event.value };
  const nextIndex = current.index + 1;
  if (nextIndex < QUESTIONS.length) {
    return { kind: "question", index: nextIndex, answers };
  }
  if (!isComplete(answers)) {
    return { kind: "question", index: current.index, answers };
  }
  return {
    kind: "result",
    answers,
    diagnosis: diagnose(answers),
  };
}
