import {
  captureResultPng,
  deliverResultPng,
  downloadBlob,
  imageShareNotice,
  pastePlaceLabel,
  readPngClipboard,
} from "./result-image";

export type ShareDestination = {
  id: string;
  label: string;
  href: string;
};

const CREATING = "結果画像を作成しています。";
const TEXT_ONLY = "画像を用意できませんでした。投稿文だけ開きました。";
const PASTE_HINT =
  "投稿画面に画像は自動で付きません。コピーした画像を貼り付けるか、保存した画像を添付してください。";

type CaptureState =
  | { status: "pending" }
  | { status: "ready"; blob: Blob }
  | { status: "failed" };

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

function copyWithCommand(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "0";
  area.style.top = "0";
  area.style.opacity = "0";
  document.body.append(area);
  area.focus();
  area.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithCommand(text);
  }
}

export function mountSharePanel(
  slot: HTMLElement,
  options: {
    paper: HTMLElement;
    filename: string;
    destinations: readonly ShareDestination[];
    linkText: string;
  },
): void {
  let open = false;
  let notice = "";
  let busy = false;
  let capture: Promise<Blob> | null = null;
  let state: CaptureState = { status: "pending" };

  slot.classList.add("share");

  function beginCapture(): Promise<Blob> {
    if (state.status === "ready") {
      return Promise.resolve(state.blob);
    }
    if (state.status === "failed") {
      capture = null;
    }
    if (!capture) {
      state = { status: "pending" };
      capture = captureResultPng(options.paper)
        .then((blob) => {
          state = { status: "ready", blob };
          return blob;
        })
        .catch((error: unknown) => {
          capture = null;
          state = { status: "failed" };
          throw error;
        });
    }
    return capture;
  }

  function focusPressed(button: HTMLElement) {
    if (button.isConnected) {
      button.focus({ preventScroll: true });
    }
  }

  function focusEnabled(selector: string): boolean {
    const nodes = slot.querySelectorAll(selector);
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (node instanceof HTMLButtonElement && !node.disabled) {
        node.focus({ preventScroll: true });
        return true;
      }
    }
    return false;
  }

  function setBusy(value: boolean) {
    busy = value;
    slot.querySelectorAll("button").forEach((node) => {
      if (node instanceof HTMLButtonElement) {
        node.disabled = value;
      }
    });
  }

  function showNotice(text: string) {
    notice = text;
    const status = slot.querySelector(".share-status");
    if (status) {
      status.textContent = text;
    }
  }

  function openPost(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function publishImage(place: string, href: string | null, pressed: HTMLButtonElement) {
    if (busy) {
      return;
    }
    if (href && state.status === "failed") {
      openPost(href);
      showNotice(TEXT_ONLY);
      focusPressed(pressed);
      return;
    }

    const clipboard = readPngClipboard();
    let opened = false;
    function openDestination() {
      if (!href || opened) {
        return;
      }
      opened = true;
      openPost(href);
    }

    const ready = state.status === "ready" ? state.blob : null;
    setBusy(true);
    if (!ready) {
      showNotice(CREATING);
    }
    void deliverResultPng({
      png: ready ?? beginCapture(),
      filename: options.filename,
      clipboard,
      download: downloadBlob,
      ...(href ? { opened: openDestination } : {}),
    })
      .then((outcome) => {
        if (outcome === "failed" && opened) {
          showNotice(TEXT_ONLY);
          return;
        }
        showNotice(imageShareNotice(outcome, place));
      })
      .catch(() => {
        showNotice(opened ? TEXT_ONLY : imageShareNotice("failed", place));
      })
      .finally(() => {
        setBusy(false);
        focusPressed(pressed);
      });
  }

  function paint() {
    slot.replaceChildren();
    const copyImage = el("button", "btn btn-image", "結果の画像をコピー");
    copyImage.type = "button";
    copyImage.setAttribute("data-share-action", "image");
    copyImage.setAttribute("aria-describedby", "share-status-text");
    copyImage.addEventListener("click", () => {
      publishImage("", null, copyImage);
    });

    const status = el("p", "share-status");
    status.id = "share-status-text";
    status.setAttribute("role", "status");
    status.textContent = notice;

    const toggle = el("button", "btn btn-share", "結果をシェア");
    toggle.type = "button";
    toggle.setAttribute("data-share-action", "toggle");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      toggle.setAttribute("aria-controls", "share-destinations");
    }
    toggle.addEventListener("click", () => {
      if (busy) {
        return;
      }
      open = !open;
      paint();
      if (open) {
        focusEnabled(".share-list button");
        return;
      }
      focusEnabled(".btn-share");
    });

    slot.append(copyImage, status, toggle);
    if (!open) {
      return;
    }

    const panel = el("div", "share-panel");
    panel.id = "share-destinations";
    panel.append(el("p", "share-hint", PASTE_HINT));
    const list = el("ul", "share-list");
    for (const destination of options.destinations) {
      const row = el("li");
      const button = el("button", "share-link", pastePlaceLabel(destination.label));
      button.type = "button";
      button.setAttribute("data-share-action", destination.id);
      button.addEventListener("click", () => {
        publishImage(destination.label, destination.href, button);
      });
      row.append(button);
      list.append(row);
    }
    const linkRow = el("li");
    const link = el("button", "share-copy share-quiet", "リンクをコピー");
    link.type = "button";
    link.setAttribute("data-share-action", "link");
    link.addEventListener("click", () => {
      if (busy) {
        return;
      }
      setBusy(true);
      void copyText(options.linkText)
        .then((copied) => {
          showNotice(copied ? "リンクをコピーしました" : "リンクをコピーできませんでした");
        })
        .finally(() => {
          setBusy(false);
          focusPressed(link);
        });
    });
    linkRow.append(link);
    list.append(linkRow);
    panel.append(list);
    slot.append(panel);
  }

  paint();
  void beginCapture().catch(() => {
    showNotice(imageShareNotice("failed", ""));
  });
}
