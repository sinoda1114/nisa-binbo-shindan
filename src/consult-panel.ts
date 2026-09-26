import {
  CONSULT_COPY,
  CONSULT_LIMIT,
  readConsultReply,
  type ConsultMessage,
  type ConsultReply,
  type ConsultResult,
} from "./consult";

type Phase = "pending" | "ready" | "unconfigured" | "failed";

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

async function requestConsult(
  result: ConsultResult,
  messages: readonly ConsultMessage[],
  signal: AbortSignal,
): Promise<ConsultReply> {
  let response: Response;
  try {
    response = await fetch("/api/consult", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        result,
        messages: messages.slice(-CONSULT_LIMIT.messages),
      }),
      signal,
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  try {
    return readConsultReply(await response.json());
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export function mountConsult(desk: HTMLElement, sheet: HTMLElement, result: ConsultResult): void {
  desk.classList.add("has-consult");
  const fab = el("button", "consult-fab", CONSULT_COPY.fab);
  fab.type = "button";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.setAttribute("aria-expanded", "false");

  let dialog: HTMLDivElement | null = null;
  let backdrop: HTMLDivElement | null = null;
  let controller: AbortController | null = null;
  let messages: ConsultMessage[] = [];

  function setBackgroundInert(inert: boolean) {
    if (inert) {
      sheet.setAttribute("inert", "");
      fab.setAttribute("inert", "");
      return;
    }
    sheet.removeAttribute("inert");
    fab.removeAttribute("inert");
  }

  function close() {
    controller?.abort();
    controller = null;
    document.removeEventListener("keydown", onKey);
    dialog?.remove();
    backdrop?.remove();
    dialog = null;
    backdrop = null;
    setBackgroundInert(false);
    document.body.style.overflow = "";
    fab.setAttribute("aria-expanded", "false");
    fab.focus({ preventScroll: true });
  }

  function onKey(event: KeyboardEvent) {
    if (!dialog) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const nodes = Array.from(dialog.querySelectorAll<HTMLElement>("button, textarea")).filter(
      (node) => !node.hasAttribute("disabled"),
    );
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function status(text: string): HTMLParagraphElement {
    const node = el("p", "consult-status", text);
    node.setAttribute("role", "status");
    return node;
  }

  function focusClose(root: HTMLElement) {
    const closeButton = root.querySelector(".consult-close");
    if (closeButton instanceof HTMLElement) {
      closeButton.focus({ preventScroll: true });
    }
  }

  function appendHeading(root: HTMLElement) {
    const title = el("h2", "consult-title", CONSULT_COPY.title);
    title.id = "consult-title";
    const closeButton = el("button", "btn btn-ghost consult-close", CONSULT_COPY.close);
    closeButton.type = "button";
    closeButton.addEventListener("click", () => close());
    const head = el("div", "consult-head");
    head.append(title, closeButton);
    root.append(head);
  }

  function appendLog(root: HTMLElement, shown: readonly ConsultMessage[]) {
    const log = el("div", "consult-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    for (const message of shown) {
      log.append(
        el(
          "p",
          message.role === "user" ? "consult-line consult-user" : "consult-line",
          message.text,
        ),
      );
    }
    root.append(log);
    const latest = log.lastElementChild;
    if (latest instanceof HTMLElement) {
      latest.tabIndex = -1;
      latest.focus({ preventScroll: true });
    }
  }

  function appendForm(root: HTMLElement, shown: readonly ConsultMessage[]) {
    const form = el("form", "consult-form");
    const field = el("textarea", "consult-input");
    field.rows = 3;
    field.maxLength = CONSULT_LIMIT.user;
    field.required = true;
    field.placeholder = CONSULT_COPY.placeholder;
    field.setAttribute("aria-label", CONSULT_COPY.placeholder);
    const submit = el("button", "btn btn-primary", CONSULT_COPY.send);
    submit.type = "submit";
    form.append(field, submit);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = field.value.trim();
      if (text.length === 0) {
        return;
      }
      void ask(shown, text);
    });
    root.append(form);
  }

  function paint(shown: readonly ConsultMessage[], phase: Phase) {
    if (!dialog) {
      return;
    }
    dialog.replaceChildren();
    appendHeading(dialog);
    switch (phase) {
      case "unconfigured":
        dialog.append(status(CONSULT_COPY.unconfigured));
        focusClose(dialog);
        return;
      case "failed":
        dialog.append(status(CONSULT_COPY.failed));
        focusClose(dialog);
        return;
      case "pending":
        if (shown.length > 0) {
          appendLog(dialog, shown);
        }
        dialog.append(status(shown.length === 0 ? CONSULT_COPY.opening : CONSULT_COPY.sending));
        focusClose(dialog);
        return;
      case "ready":
        dialog.append(el("p", "consult-note", CONSULT_COPY.note));
        appendLog(dialog, shown);
        appendForm(dialog, shown);
        return;
      default: {
        const unreachable: never = phase;
        return unreachable;
      }
    }
  }

  async function ask(history: readonly ConsultMessage[], userText?: string) {
    const pending = userText ? [...history, { role: "user" as const, text: userText }] : [...history];
    controller?.abort();
    const next = new AbortController();
    controller = next;
    paint(pending, "pending");
    const reply = await requestConsult(result, pending, next.signal);
    if (next.signal.aborted || controller !== next) {
      return;
    }
    if (reply.ok) {
      messages = [...pending, { role: "model", text: reply.text }];
      paint(messages, "ready");
      return;
    }
    if (reply.reason === "unconfigured") {
      messages = [];
      paint([], "unconfigured");
      return;
    }
    paint(pending, "failed");
  }

  function open() {
    if (dialog) {
      return;
    }
    backdrop = el("div", "consult-backdrop");
    backdrop.addEventListener("click", () => close());
    dialog = el("div", "consult-sheet");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "consult-title");
    desk.append(backdrop, dialog);
    setBackgroundInert(true);
    document.body.style.overflow = "hidden";
    fab.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKey);
    if (messages.length === 0) {
      void ask([]);
      return;
    }
    paint(messages, "ready");
  }

  fab.addEventListener("click", () => open());
  desk.append(fab);
}
