import { diagnose } from "./diagnosis/diagnose";
import type { Answers, Diagnosis, Verdict } from "./diagnosis/types";
import { QUESTIONS, isComplete, type Question } from "./quiz";
import { shareHref, shareMessage, type ShareTarget } from "./share";
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

const SHARE_LINKS: { target: ShareTarget; label: string }[] = [
  { target: "x", label: "X" },
  { target: "line", label: "LINE" },
  { target: "facebook", label: "Facebook" },
  { target: "threads", label: "Threads" },
];

const app = requireApp();

let screen: Screen = { kind: "start" };
let shareOpen = false;
let shareFocus: "stamp" | "button" | "list" = "stamp";

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
  const previous = screen.kind;
  screen = reduce(screen, event);
  if (screen.kind !== "result" || previous !== "result") {
    shareOpen = false;
    shareFocus = "stamp";
  }
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

function appendBlocks(parent: HTMLElement, className: string, text: string) {
  const box = el("div", className);
  for (const block of text.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (trimmed.length === 0) {
      continue;
    }
    box.append(el("p", undefined, trimmed));
  }
  parent.append(box);
}

function renderDisclaimer(parent: HTMLElement) {
  parent.append(el("p", "disclaimer", DISCLAIMER));
}

function mount(sheet: HTMLElement, focusOn: HTMLElement) {
  const desk = el("div", "desk");
  desk.append(sheet);
  app.replaceChildren(desk);
  window.scrollTo(0, 0);
  focusOn.tabIndex = -1;
  focusOn.focus({ preventScroll: true });
}

function runningHead(): HTMLElement {
  return el("p", "running", "NISA貧乏診断");
}

function renderStart() {
  const card = el("section", "panel sheet");
  const title = el("h1", "title", "NISA貧乏診断");
  card.append(el("p", "kicker", "家計簿の一ページ"));
  card.append(title);
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
  mount(card, title);
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
  const heading = el("h1", "question", question.prompt);
  card.append(heading);
  const list = el("div", "choices");
  appendChoices(question, answers, list);
  card.append(list);
  mount(card, heading);
}

function renderResult(diagnosis: Diagnosis) {
  const card = el("section", "panel sheet");
  const stamp = el(
    "p",
    `stamp verdict verdict-${diagnosis.verdict}`,
    VERDICT_LABEL[diagnosis.verdict],
  );
  card.append(runningHead());
  card.append(stamp);
  card.append(el("h1", "headline", diagnosis.headline));
  appendBlocks(card, "summary", diagnosis.summary);
  if (diagnosis.findings.length > 0) {
    const list = el("div", "findings");
    for (const finding of diagnosis.findings) {
      const item = el("article", `finding finding-${finding.severity}`);
      item.append(el("h2", "finding-title", finding.title));
      appendBlocks(item, "finding-detail", finding.detail);
      list.append(item);
    }
    card.append(list);
  }
  const shareButton = el("button", "btn btn-share", "シェア");
  shareButton.type = "button";
  shareButton.setAttribute("aria-expanded", shareOpen ? "true" : "false");
  if (shareOpen) {
    shareButton.setAttribute("aria-controls", "share-destinations");
  }
  shareButton.addEventListener("click", () => {
    shareOpen = !shareOpen;
    shareFocus = shareOpen ? "list" : "button";
    render();
  });
  card.append(shareButton);
  const list = shareOpen ? renderShareList(diagnosis.headline) : null;
  if (list) {
    card.append(list);
  }
  const restart = el("button", "btn btn-primary", "もう一度はじめる");
  restart.addEventListener("click", () => dispatch({ type: "restart" }));
  card.append(restart);
  renderDisclaimer(card);
  const listFocus = list?.querySelector("a");
  const focusOn =
    shareFocus === "list" && listFocus instanceof HTMLElement
      ? listFocus
      : shareFocus === "button"
        ? shareButton
        : stamp;
  mount(card, focusOn);
}

function renderShareList(headline: string): HTMLElement {
  const message = shareMessage(headline);
  const panel = el("div", "share-panel");
  const list = el("ul", "share-list");
  list.id = "share-destinations";
  for (const item of SHARE_LINKS) {
    const row = el("li");
    const link = el("a", "share-link", item.label);
    link.href = shareHref(item.target, headline);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.append(link);
    list.append(row);
  }
  const copyRow = el("li");
  const copy = el("button", "share-copy", "リンクをコピー");
  copy.type = "button";
  const status = el("p", "share-status");
  status.setAttribute("role", "status");
  copy.addEventListener("click", () => {
    void copyShareText(message, status, copy);
  });
  copyRow.append(copy);
  list.append(copyRow);
  panel.append(list);
  panel.append(status);
  return panel;
}

async function copyShareText(
  message: string,
  status: HTMLElement,
  button: HTMLButtonElement,
) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(message);
    copied = true;
  } catch {
    copied = copyWithCommand(message);
  }
  status.textContent = copied ? "コピーしました" : "コピーできませんでした";
  requestAnimationFrame(() => {
    if (button.isConnected) {
      button.focus();
    }
  });
}

function copyWithCommand(message: string): boolean {
  const field = document.createElement("textarea");
  field.value = message;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  document.body.append(field);
  field.focus();
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
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
