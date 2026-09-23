import { literacyMood, resultBadge, resultCharacter } from "../result-art";
import { LITERACY_IMAGE_NAME } from "../result-image";
import { mountSharePanel } from "../share-panel";
import { PROVISIONAL_TITLE, QUESTIONS, TITLE_NOTE, type Question } from "./quiz";
import { linkToCopy, shareTargets } from "./share";
import {
  initialScreen,
  reduce,
  type ChooseEvent,
  type Event,
} from "./session";
import type { Answers, Diagnosis, FindingSeverity, Verdict } from "./types";

const DISCLAIMER =
  "この診断は教育目的の目安です。投資助言でも税務助言でもありません。銘柄や金額は勧めません。税額は計算しません。回答は保存しません。タイトルは仮のものです。";

const VERDICT_LABEL: Record<Verdict, string> = {
  gap: "誤解がありそうです",
  shaky: "確認した方がよさそうです",
  solid: "概ね合っています",
};

const STAMP_CLASS: Record<Verdict, string> = {
  gap: "verdict-loss",
  shaky: "verdict-risky",
  solid: "verdict-ok",
};

const FINDING_CLASS: Record<FindingSeverity, string> = {
  gap: "finding-loss",
  shaky: "finding-risk",
};

type MountOptions = {
  onExit: () => void;
};

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

function mountSheet(root: HTMLElement, sheet: HTMLElement, focusOn: HTMLElement) {
  const desk = el("div", "desk");
  desk.append(sheet);
  root.replaceChildren(desk);
  window.scrollTo(0, 0);
  focusOn.tabIndex = -1;
  focusOn.focus({ preventScroll: true });
}

function choiceButton(label: string, selected: boolean): HTMLButtonElement {
  const button = el(
    "button",
    selected ? "btn btn-choice is-selected" : "btn btn-choice",
    label,
  );
  button.type = "button";
  return button;
}

function addChoices<Value extends string>(
  list: HTMLElement,
  choices: readonly { value: Value; label: string }[],
  selected: Value | undefined,
  choose: (value: Value) => void,
) {
  for (const choice of choices) {
    const button = choiceButton(choice.label, selected === choice.value);
    button.addEventListener("click", () => choose(choice.value));
    list.append(button);
  }
}

function appendChoices(
  question: Question,
  answers: Partial<Answers>,
  list: HTMLElement,
  onChoose: (event: ChooseEvent) => void,
) {
  switch (question.field) {
    case "purchasingPower":
      addChoices(list, question.choices, answers.purchasingPower, (value) =>
        onChoose({ type: "choose", field: "purchasingPower", value }),
      );
      return;
    case "compound":
      addChoices(list, question.choices, answers.compound, (value) =>
        onChoose({ type: "choose", field: "compound", value }),
      );
      return;
    case "depositCover":
      addChoices(list, question.choices, answers.depositCover, (value) =>
        onChoose({ type: "choose", field: "depositCover", value }),
      );
      return;
    case "accountFiling":
      addChoices(list, question.choices, answers.accountFiling, (value) =>
        onChoose({ type: "choose", field: "accountFiling", value }),
      );
      return;
    case "returnOfCapital":
      addChoices(list, question.choices, answers.returnOfCapital, (value) =>
        onChoose({ type: "choose", field: "returnOfCapital", value }),
      );
      return;
    case "nisaHolding":
      addChoices(list, question.choices, answers.nisaHolding, (value) =>
        onChoose({ type: "choose", field: "nisaHolding", value }),
      );
      return;
    case "pensionDeferral":
      addChoices(list, question.choices, answers.pensionDeferral, (value) =>
        onChoose({ type: "choose", field: "pensionDeferral", value }),
      );
      return;
    case "tsumitate":
      addChoices(list, question.choices, answers.tsumitate, (value) =>
        onChoose({ type: "choose", field: "tsumitate", value }),
      );
      return;
    case "trustFee":
      addChoices(list, question.choices, answers.trustFee, (value) =>
        onChoose({ type: "choose", field: "trustFee", value }),
      );
      return;
    default: {
      const unreachable: never = question;
      throw new Error(`設問がありません: ${JSON.stringify(unreachable)}`);
    }
  }
}

export function mountLiteracy(root: HTMLElement, options: MountOptions) {
  let screen = initialScreen();
  let active = true;

  function leave() {
    active = false;
    options.onExit();
  }

  function dispatch(event: Event) {
    if (!active) {
      return;
    }
    screen = reduce(screen, event);
    render();
  }

  function renderIntro() {
    const card = el("section", "panel sheet");
    const title = el("h1", "title", PROVISIONAL_TITLE);
    card.append(el("p", "kicker", "家計簿の一ページ"));
    card.append(title);
    card.append(el("p", "facts", TITLE_NOTE));
    card.append(
      el(
        "p",
        "lead",
        "制度の数字、口座の種類、税金の扱い、よくある誤解を質問で確認します。NISAの使い方の取りこぼしを見る診断とは別です。",
      ),
    );
    const start = el("button", "btn btn-primary", "診断をはじめる");
    start.type = "button";
    start.addEventListener("click", () => dispatch({ type: "start" }));
    card.append(start);
    const back = el("button", "btn btn-block", "診断の選択に戻る");
    back.type = "button";
    back.addEventListener("click", () => leave());
    card.append(back);
    card.append(el("p", "disclaimer", DISCLAIMER));
    mountSheet(root, card, title);
  }

  function renderQuestion(index: number, answers: Partial<Answers>) {
    const question = QUESTIONS[index];
    if (!question) {
      throw new Error("設問がありません");
    }
    const card = el("section", "panel sheet");
    card.append(el("p", "running", PROVISIONAL_TITLE));
    const nav = el("div", "nav");
    const back = el("button", "btn btn-ghost", "戻る");
    back.type = "button";
    back.addEventListener("click", () => dispatch({ type: "back" }));
    nav.append(back);
    nav.append(el("p", "progress", `${index + 1}/${QUESTIONS.length}`));
    card.append(nav);
    const meter = el("div", "meter");
    meter.setAttribute("aria-hidden", "true");
    meter.style.setProperty("--fill", `${((index + 1) / QUESTIONS.length) * 100}%`);
    card.append(meter);
    const heading = el("h1", "question", question.prompt);
    card.append(heading);
    const list = el("div", "choices");
    appendChoices(question, answers, list, dispatch);
    card.append(list);
    mountSheet(root, card, heading);
  }

  function renderResult(diagnosis: Diagnosis) {
    if (screen.kind !== "result") {
      return;
    }
    const card = el("section", "panel sheet");
    const stamp = el(
      "p",
      `stamp verdict ${STAMP_CLASS[diagnosis.verdict]}`,
      VERDICT_LABEL[diagnosis.verdict],
    );
    const mood = literacyMood(diagnosis.verdict);
    const head = el("div", "result-head");
    const marks = el("div", "result-marks");
    marks.append(stamp, resultBadge(mood));
    head.append(marks, resultCharacter(mood));
    card.append(el("p", "running", PROVISIONAL_TITLE));
    card.append(head);
    card.append(el("h1", "headline", diagnosis.headline));
    card.append(el("p", "summary", diagnosis.summary));
    if (diagnosis.findings.length > 0) {
      const list = el("div", "findings");
      for (const finding of diagnosis.findings) {
        const item = el("article", `finding ${FINDING_CLASS[finding.severity]}`);
        item.append(el("h2", "finding-title", finding.title));
        item.append(el("p", "finding-detail", finding.detail));
        list.append(item);
      }
      card.append(list);
    }
    const share = el("div", "share");
    share.setAttribute("data-share", "");
    card.append(share);
    const restart = el("button", "btn btn-primary", "もう一度はじめる");
    restart.type = "button";
    restart.addEventListener("click", () => dispatch({ type: "restart" }));
    card.append(restart);
    const back = el("button", "btn btn-block", "診断の選択に戻る");
    back.type = "button";
    back.addEventListener("click", () => leave());
    card.append(back);
    card.append(el("p", "disclaimer", DISCLAIMER));
    mountSheet(root, card, stamp);
    mountSharePanel(share, {
      paper: card,
      filename: LITERACY_IMAGE_NAME,
      destinations: shareTargets(diagnosis.verdict),
      linkText: linkToCopy(),
    });
  }

  function render() {
    switch (screen.kind) {
      case "intro":
        renderIntro();
        return;
      case "question":
        renderQuestion(screen.index, screen.answers);
        return;
      case "result":
        renderResult(screen.diagnosis);
        return;
      default: {
        const unreachable: never = screen;
        throw new Error(`画面がありません: ${JSON.stringify(unreachable)}`);
      }
    }
  }

  render();
}
