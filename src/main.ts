import { diagnose } from "./diagnosis/diagnose";
import type { Answers, Diagnosis, Verdict } from "./diagnosis/types";
import { mountLiteracy } from "./literacy/view";
import { QUESTIONS, isComplete, type Question } from "./quiz";
import { resultHead } from "./result-art";
import { NISA_IMAGE_NAME, noteClipboardPermission } from "./result-image";
import { mountSharePanel } from "./share-panel";
import { shareMessage, shareTargets } from "./share";
import { linkToCopy } from "./share-destinations";
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

function openHome() {
  renderHome();
}

function openNisa() {
  screen = { kind: "start" };
  render();
}

function openLiteracy() {
  mountLiteracy(app, { onExit: openHome });
}

function renderHome() {
  const card = el("section", "panel sheet");
  const title = el("h1", "title", "診断を選ぶ");
  card.append(el("p", "kicker", "家計簿の一ページ"));
  card.append(title);
  card.append(
    el(
      "p",
      "lead",
      "NISAの使い方と金融制度の理解を、それぞれ別の診断で確認できます。",
    ),
  );
  const nisa = el("button", "btn btn-primary", "NISA貧乏診断");
  nisa.type = "button";
  nisa.addEventListener("click", () => openNisa());
  card.append(nisa);
  const literacy = el("button", "btn btn-block", "金融リテラシー診断（仮）");
  literacy.type = "button";
  literacy.addEventListener("click", () => openLiteracy());
  card.append(literacy);
  card.append(el("p", "facts", "金融リテラシー診断のタイトルは仮のものです。"));
  renderDisclaimer(card);
  mount(card, title);
}

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
      "いくつかの質問から、NISAの非課税枠を活用できているかを確認します。結果は「損している」「危うい」「概ね良い」の3段階で示します。",
    ),
  );
  card.append(
    el(
      "p",
      "facts",
      "つみたて投資枠は年120万円、成長投資枠は年240万円、合計は年360万円です。未使用の年間枠は翌年に繰り越せません。生涯の非課税保有限度額は1,800万円で、うち成長投資枠は1,200万円までです。",
    ),
  );
  const start = el("button", "btn btn-primary", "診断をはじめる");
  start.type = "button";
  start.addEventListener("click", () => dispatch({ type: "start" }));
  card.append(start);
  const backHome = el("button", "btn btn-block", "診断の選択に戻る");
  backHome.type = "button";
  backHome.addEventListener("click", () => openHome());
  card.append(backHome);
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

function addChoices<Field extends keyof Answers>(
  list: HTMLElement,
  field: Field,
  choices: readonly { value: Answers[Field]; label: string }[],
  selected: Answers[Field] | undefined,
) {
  for (const choice of choices) {
    const button = choiceButton(choice.label, selected === choice.value);
    button.addEventListener("click", () =>
      dispatch({ type: "choose", field, value: choice.value } as ChooseEvent),
    );
    list.append(button);
  }
}

function appendChoices(
  question: Question,
  answers: Partial<Answers>,
  list: HTMLElement,
) {
  switch (question.field) {
    case "account":
      addChoices(list, question.field, question.choices, answers.account);
      return;
    case "quotaUse":
      addChoices(list, question.field, question.choices, answers.quotaUse);
      return;
    case "frameUse":
      addChoices(list, question.field, question.choices, answers.frameUse);
      return;
    case "recurring":
      addChoices(list, question.field, question.choices, answers.recurring);
      return;
    case "soldThisYear":
      addChoices(list, question.field, question.choices, answers.soldThisYear);
      return;
    case "idleCash":
      addChoices(list, question.field, question.choices, answers.idleCash);
      return;
    case "brokerCash":
      addChoices(list, question.field, question.choices, answers.brokerCash);
      return;
    case "taxableLeak":
      addChoices(list, question.field, question.choices, answers.taxableLeak);
      return;
    case "sameBroker":
      addChoices(list, question.field, question.choices, answers.sameBroker);
      return;
    case "dividendRoute":
      addChoices(list, question.field, question.choices, answers.dividendRoute);
      return;
    default: {
      const unreachable: never = question;
      return unreachable;
    }
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
  card.append(resultHead(stamp, diagnosis.verdict));
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
  const share = el("div");
  share.setAttribute("data-share", "");
  card.append(share);
  const restart = el("button", "btn btn-primary", "もう一度はじめる");
  restart.type = "button";
  restart.addEventListener("click", () => dispatch({ type: "restart" }));
  card.append(restart);
  renderDisclaimer(card);
  mount(card, stamp);
  mountSharePanel(share, {
    paper: card,
    filename: NISA_IMAGE_NAME,
    message: shareMessage(diagnosis.verdict),
    title: "NISA貧乏診断",
    destinations: shareTargets(diagnosis.verdict),
    linkText: linkToCopy(),
  });
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

noteClipboardPermission();
openHome();
