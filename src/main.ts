import { diagnose } from "./diagnosis/diagnose";
import type { Answers, Diagnosis, Verdict } from "./diagnosis/types";
import { QUESTIONS, isComplete, type Question } from "./quiz";
import "./style.css";

type Screen =
  | { kind: "start" }
  | { kind: "question"; index: number; answers: Partial<Answers> }
  | { kind: "result"; answers: Answers; diagnosis: Diagnosis };

type ChooseEvent = {
  [Field in keyof Answers]: {
    type: "choose";
    field: Field;
    value: Answers[Field];
  };
}[keyof Answers];

type Event =
  | { type: "start" }
  | { type: "back" }
  | { type: "restart" }
  | ChooseEvent;

const DISCLAIMER =
  "この診断は教育目的の目安です。投資助言でも税務助言でもありません。銘柄の推奨や税額の計算はしません。回答は保存しません。";

const VERDICT_LABEL: Record<Verdict, string> = {
  loss: "損している",
  risky: "危うい",
  ok: "概ね良い",
};

function requireApp(): HTMLElement {
  const node = document.querySelector("#app");
  if (!(node instanceof HTMLElement)) {
    throw new Error("画面の土台 (#app) がありません");
  }
  return node;
}

const app = requireApp();

let screen: Screen = { kind: "start" };

function reduce(current: Screen, event: Event): Screen {
  switch (event.type) {
    case "start":
      return { kind: "question", index: 0, answers: {} };
    case "restart":
      return { kind: "start" };
    case "back":
      return goBack(current);
    case "choose":
      return applyChoice(current, event);
  }
}

function goBack(current: Screen): Screen {
  if (current.kind !== "question") {
    return current;
  }
  if (current.index === 0) {
    return { kind: "start" };
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

function dispatch(event: Event) {
  screen = reduce(screen, event);
  render();
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function renderDisclaimer(parent: HTMLElement) {
  parent.append(el("p", "disclaimer", DISCLAIMER));
}

function mount(sheet: HTMLElement) {
  const desk = el("div", "desk");
  desk.append(sheet);
  app.replaceChildren(desk);
  window.scrollTo(0, 0);
  const heading = sheet.querySelector("h1");
  if (heading instanceof HTMLElement) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function runningHead(): HTMLElement {
  return el("p", "running", "NISA貧乏診断");
}

function renderStart() {
  const card = el("section", "panel sheet");
  card.append(el("p", "kicker", "家計簿の一ページ"));
  card.append(el("h1", "title", "NISA貧乏診断"));
  card.append(
    el(
      "p",
      "lead",
      "いくつかの質問に答えると、NISAの使い方として非課税の恩恵を取りこぼしていないかを、損している・危うい・概ね良いで示します。",
    ),
  );
  card.append(
    el(
      "p",
      "facts",
      "つみたて投資枠は年120万円、成長投資枠は年240万円、合計は年360万円です。未使用の年間枠は翌年に繰り越せません。生涯の非課税保有限度額は1800万円で、うち成長投資枠は1200万円までです。",
    ),
  );
  const start = el("button", "btn btn-primary", "診断をはじめる");
  start.addEventListener("click", () => dispatch({ type: "start" }));
  card.append(start);
  renderDisclaimer(card);
  mount(card);
}

function choiceButton(label: string, selected: boolean): HTMLButtonElement {
  return el(
    "button",
    selected ? "btn btn-choice is-selected" : "btn btn-choice",
    label,
  );
}

function appendChoices(
  question: Question,
  answers: Partial<Answers>,
  list: HTMLElement,
) {
  switch (question.field) {
    case "account":
      for (const choice of question.choices) {
        const button = choiceButton(choice.label, answers.account === choice.value);
        button.addEventListener("click", () =>
          dispatch({ type: "choose", field: "account", value: choice.value }),
        );
        list.append(button);
      }
      return;
    case "quotaUse":
      for (const choice of question.choices) {
        const button = choiceButton(choice.label, answers.quotaUse === choice.value);
        button.addEventListener("click", () =>
          dispatch({ type: "choose", field: "quotaUse", value: choice.value }),
        );
        list.append(button);
      }
      return;
    case "frameUse":
      for (const choice of question.choices) {
        const button = choiceButton(choice.label, answers.frameUse === choice.value);
        button.addEventListener("click", () =>
          dispatch({ type: "choose", field: "frameUse", value: choice.value }),
        );
        list.append(button);
      }
      return;
    case "idleCash":
      for (const choice of question.choices) {
        const button = choiceButton(choice.label, answers.idleCash === choice.value);
        button.addEventListener("click", () =>
          dispatch({ type: "choose", field: "idleCash", value: choice.value }),
        );
        list.append(button);
      }
      return;
    case "taxableLeak":
      for (const choice of question.choices) {
        const button = choiceButton(choice.label, answers.taxableLeak === choice.value);
        button.addEventListener("click", () =>
          dispatch({ type: "choose", field: "taxableLeak", value: choice.value }),
        );
        list.append(button);
      }
      return;
  }
}

function renderQuestion(index: number, answers: Partial<Answers>) {
  const question = QUESTIONS[index];
  if (!question) {
    throw new Error("設問がありません");
  }
  const card = el("section", "panel sheet");
  card.append(runningHead());
  const nav = el("div", "nav");
  const back = el("button", "btn btn-ghost", "戻る");
  back.addEventListener("click", () => dispatch({ type: "back" }));
  nav.append(back);
  nav.append(el("p", "progress", `${index + 1}/${QUESTIONS.length}`));
  card.append(nav);
  const meter = el("div", "meter");
  meter.setAttribute("aria-hidden", "true");
  meter.style.setProperty(
    "--fill",
    `${((index + 1) / QUESTIONS.length) * 100}%`,
  );
  card.append(meter);
  card.append(el("h1", "question", question.prompt));
  const list = el("div", "choices");
  appendChoices(question, answers, list);
  card.append(list);
  mount(card);
}

function renderResult(diagnosis: Diagnosis) {
  const card = el("section", "panel sheet");
  card.append(runningHead());
  card.append(
    el(
      "p",
      `stamp verdict verdict-${diagnosis.verdict}`,
      VERDICT_LABEL[diagnosis.verdict],
    ),
  );
  card.append(el("h1", "headline", diagnosis.headline));
  card.append(el("p", "summary", diagnosis.summary));
  if (diagnosis.findings.length > 0) {
    const list = el("div", "findings");
    for (const finding of diagnosis.findings) {
      const item = el("article", `finding finding-${finding.severity}`);
      item.append(el("h2", "finding-title", finding.title));
      item.append(el("p", "finding-detail", finding.detail));
      list.append(item);
    }
    card.append(list);
  }
  const restart = el("button", "btn btn-primary", "もう一度はじめる");
  restart.addEventListener("click", () => dispatch({ type: "restart" }));
  card.append(restart);
  renderDisclaimer(card);
  mount(card);
}

function render() {
  switch (screen.kind) {
    case "start":
      renderStart();
      return;
    case "question":
      renderQuestion(screen.index, screen.answers);
      return;
    case "result":
      renderResult(screen.diagnosis);
      return;
  }
}

render();
