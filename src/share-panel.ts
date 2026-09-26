import {
  DIRECT_SHARE_HINT,
  captureResultPng,
  deliverResultPng,
  directShareNotice,
  downloadBlob,
  imageShareNotice,
  pastePlaceLabel,
  prepareResultShare,
  readPngClipboard,
  resultImageFile,
  sharePreparedResult,
  type ResultShareTarget,
} from "./result-image";

export type ShareDestination = {
  id: string;
  label: string;
  href: string;
};

const CREATING = "結果画像を作成しています。";
const FALLBACK_HINT = "このブラウザでは、画像を付けたまま投稿先を開けません。";

type ShareMode =
  | { kind: "pending" }
  | { kind: "failed" }
  | { kind: "sheet"; blob: Blob; data: ShareData }
  | { kind: "links"; blob: Blob; open: boolean };

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

function browserShareTarget(): ResultShareTarget {
  const target: ResultShareTarget = {};
  if (typeof navigator.canShare === "function") {
    const canShare = navigator.canShare.bind(navigator);
    target.canShare = (data) => canShare(data);
  }
  if (typeof navigator.share === "function") {
    const share = navigator.share.bind(navigator);
    target.share = (data) => share(data);
  }
  return target;
}

export function mountSharePanel(
  slot: HTMLElement,
  options: {
    paper: HTMLElement;
    filename: string;
    message: string;
    title: string;
    destinations: readonly ShareDestination[];
    linkText: string;
  },
): void {
  let notice = "";
  let busy = false;
  let capture: Promise<Blob> | null = null;
  let mode: ShareMode = { kind: "pending" };

  slot.classList.add("share");

  function focusIn(selector: string) {
    const next = slot.querySelector(selector);
    if (next instanceof HTMLElement) {
      next.focus({ preventScroll: true });
    }
  }

  function setBusy(value: boolean) {
    busy = value;
    slot.querySelectorAll("button").forEach((node) => {
      if (!(node instanceof HTMLButtonElement)) {
        return;
      }
      const waitsForImage = node.classList.contains("btn-share") && mode.kind === "pending";
      node.disabled = value || waitsForImage;
    });
  }

  function showNotice(text: string) {
    notice = text;
    const status = slot.querySelector(".share-status");
    if (status) {
      status.textContent = text;
    }
  }

  function beginCapture(): Promise<Blob> {
    if (mode.kind === "sheet" || mode.kind === "links") {
      return Promise.resolve(mode.blob);
    }
    if (capture) {
      return capture;
    }
    mode = { kind: "pending" };
    notice = CREATING;
    capture = captureResultPng(options.paper)
      .then((blob) => {
        const data = prepareResultShare(
          resultImageFile(blob, options.filename),
          options.message,
          options.title,
          browserShareTarget(),
        );
        mode = data ? { kind: "sheet", blob, data } : { kind: "links", blob, open: false };
        if (notice === CREATING) {
          notice = "";
        }
        paint();
        setBusy(busy);
        return blob;
      })
      .catch((error: unknown) => {
        capture = null;
        mode = { kind: "failed" };
        notice = imageShareNotice("failed", "");
        paint();
        setBusy(busy);
        throw error;
      });
    paint();
    return capture;
  }

  function publishImage(blob: Blob, place: string, href: string, pressed: HTMLButtonElement) {
    if (busy) {
      return;
    }
    setBusy(true);
    void deliverResultPng({
      png: blob,
      filename: options.filename,
      clipboard: readPngClipboard(),
      download: downloadBlob,
      opened: () => {
        window.open(href, "_blank", "noopener,noreferrer");
      },
    })
      .then((outcome) => {
        showNotice(imageShareNotice(outcome, place));
      })
      .catch(() => {
        showNotice(imageShareNotice("failed", place));
      })
      .finally(() => {
        setBusy(false);
        if (pressed.isConnected) {
          pressed.focus({ preventScroll: true });
        }
      });
  }

  function shareSheet(pressed: HTMLButtonElement, blob: Blob, data: ShareData) {
    if (busy) {
      return;
    }
    const pending = sharePreparedResult(data, browserShareTarget());
    setBusy(true);
    void pending
      .then((outcome) => {
        if (outcome === "unavailable") {
          mode = { kind: "links", blob, open: true };
          notice = directShareNotice(outcome);
          paint();
          return;
        }
        if (outcome !== "aborted") {
          showNotice(directShareNotice(outcome));
        }
      })
      .finally(() => {
        setBusy(false);
        if (mode.kind === "links" && mode.open) {
          focusIn(".share-list button");
          return;
        }
        if (pressed.isConnected) {
          pressed.focus({ preventScroll: true });
          return;
        }
        focusIn(".btn-share");
      });
  }

  function paint() {
    slot.replaceChildren();
    const status = el("p", "share-status");
    status.id = "share-status-text";
    status.setAttribute("role", "status");
    status.textContent = notice;

    const share = el("button", "btn btn-share", "結果をシェア");
    share.type = "button";
    share.disabled = mode.kind === "pending";
    share.setAttribute("data-share-action", "share");
    share.setAttribute("aria-describedby", "share-status-text");
    if (mode.kind === "links") {
      share.setAttribute("aria-expanded", mode.open ? "true" : "false");
      if (mode.open) {
        share.setAttribute("aria-controls", "share-destinations");
      }
    }
    share.addEventListener("click", () => {
      if (busy || mode.kind === "pending") {
        return;
      }
      if (mode.kind === "failed") {
        void beginCapture().catch(() => {});
        focusIn(".btn-share");
        return;
      }
      if (mode.kind === "sheet") {
        shareSheet(share, mode.blob, mode.data);
        return;
      }
      mode = { kind: "links", blob: mode.blob, open: !mode.open };
      paint();
      focusIn(mode.open ? ".share-list button" : ".btn-share");
    });

    const link = el("button", "share-quiet", "リンクをコピー");
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
          if (link.isConnected) {
            link.focus({ preventScroll: true });
          }
        });
    });

    slot.append(share, status);
    if (mode.kind === "sheet") {
      const hint = el("p", "share-hint", DIRECT_SHARE_HINT);
      hint.id = "share-hint-text";
      share.setAttribute("aria-describedby", "share-status-text share-hint-text");
      slot.append(hint);
    }
    slot.append(link);

    const showDestinations = mode.kind === "failed" || (mode.kind === "links" && mode.open);
    if (!showDestinations) {
      return;
    }
    const panel = el("div", "share-panel");
    panel.id = "share-destinations";
    if (mode.kind === "links") {
      panel.append(el("p", "share-hint", FALLBACK_HINT));
    }
    const list = el("ul", "share-list");
    for (const destination of options.destinations) {
      const row = el("li");
      const button = el("button", "share-link", pastePlaceLabel(destination.label));
      button.type = "button";
      button.setAttribute("data-share-action", destination.id);
      button.addEventListener("click", () => {
        if (mode.kind === "links") {
          publishImage(mode.blob, destination.label, destination.href, button);
          return;
        }
        window.open(destination.href, "_blank", "noopener,noreferrer");
      });
      row.append(button);
      list.append(row);
    }
    panel.append(list);
    slot.append(panel);
  }

  void beginCapture().catch(() => {});
}
