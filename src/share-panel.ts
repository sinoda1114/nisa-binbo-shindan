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

const FALLBACK_HINT = "このブラウザでは、画像を付けたまま投稿先を開けません。";

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
  let open = false;
  let notice = "";
  let busy = false;
  let capture: Promise<Blob> | null = null;
  let captured: Blob | null = null;
  let directShare = false;

  slot.classList.add("share");

  function payloadFor(blob: Blob): ShareData | null {
    return prepareResultShare(
      resultImageFile(blob, options.filename),
      options.message,
      options.title,
      browserShareTarget(),
    );
  }

  function beginCapture(): Promise<Blob> {
    if (captured) {
      return Promise.resolve(captured);
    }
    if (!capture) {
      capture = captureResultPng(options.paper)
        .then((blob) => {
          captured = blob;
          directShare = payloadFor(blob) !== null;
          if (directShare) {
            paint();
          }
          setBusy(busy);
          return blob;
        })
        .catch((error: unknown) => {
          capture = null;
          throw error;
        });
    }
    return capture;
  }

  function focusPressed(button: HTMLElement) {
    const next = button.isConnected ? button : slot.querySelector(".btn-share");
    if (next instanceof HTMLElement && next.isConnected) {
      next.focus({ preventScroll: true });
    }
  }

  function setBusy(value: boolean) {
    busy = value;
    slot.querySelectorAll("button").forEach((node) => {
      if (!(node instanceof HTMLButtonElement)) {
        return;
      }
      const waitsForImage = node.classList.contains("share-link") || node.classList.contains("btn-share");
      node.disabled = value || (waitsForImage && captured === null);
    });
  }

  function showNotice(text: string) {
    notice = text;
    const status = slot.querySelector(".share-status");
    if (status) {
      status.textContent = text;
    }
  }

  function revealFallback(text: string) {
    directShare = false;
    open = true;
    notice = text;
    paint();
    const next = slot.querySelector(".share-list button");
    if (next instanceof HTMLElement) {
      next.focus({ preventScroll: true });
    }
  }

  function publishImage(place: string, href: string, pressed: HTMLButtonElement) {
    if (busy) {
      return;
    }
    const ready = captured;
    setBusy(true);
    if (!ready) {
      slot.setAttribute("data-pending-share", "");
      showNotice("結果画像を作成しています。");
    }
    const pending = deliverResultPng({
      png: ready ?? beginCapture(),
      filename: options.filename,
      clipboard: readPngClipboard(),
      download: downloadBlob,
      opened: () => {
        window.open(href, "_blank", "noopener,noreferrer");
      },
    });
    void pending
      .then((outcome) => {
        showNotice(imageShareNotice(outcome, place));
      })
      .catch(() => {
        showNotice(imageShareNotice("failed", place));
      })
      .finally(() => {
        slot.removeAttribute("data-pending-share");
        setBusy(false);
        focusPressed(pressed);
      });
  }

  function shareImage(pressed: HTMLButtonElement, data: ShareData) {
    if (busy) {
      return;
    }
    const pending = sharePreparedResult(data, browserShareTarget());
    directShare = true;
    setBusy(true);
    let openedFallback = false;
    void pending
      .then((outcome) => {
        if (outcome === "unavailable") {
          openedFallback = true;
          revealFallback(directShareNotice(outcome));
          return;
        }
        if (outcome === "aborted") {
          return;
        }
        showNotice(directShareNotice(outcome));
        if (!slot.querySelector(".share-hint")) {
          paint();
        }
      })
      .finally(() => {
        setBusy(false);
        if (!openedFallback) {
          focusPressed(pressed);
        }
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
    share.disabled = captured === null;
    share.setAttribute("data-share-action", "share");
    share.setAttribute("aria-describedby", "share-status-text");
    if (!directShare && open) {
      share.setAttribute("aria-expanded", "true");
      share.setAttribute("aria-controls", "share-destinations");
    } else if (!directShare) {
      share.setAttribute("aria-expanded", "false");
    }
    share.addEventListener("click", () => {
      if (busy || captured === null) {
        return;
      }
      const data = payloadFor(captured);
      if (data) {
        shareImage(share, data);
        return;
      }
      open = !open;
      paint();
      const next = open
        ? slot.querySelector(".share-list button")
        : slot.querySelector(".btn-share");
      if (next instanceof HTMLElement) {
        next.focus({ preventScroll: true });
      }
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
          focusPressed(link);
        });
    });

    slot.append(share, status);
    if (directShare) {
      const hint = el("p", "share-hint", DIRECT_SHARE_HINT);
      hint.id = "share-hint-text";
      share.setAttribute("aria-describedby", "share-status-text share-hint-text");
      slot.append(hint);
    }
    slot.append(link);

    if (open && !directShare) {
      const panel = el("div", "share-panel");
      panel.id = "share-destinations";
      panel.append(el("p", "share-hint", FALLBACK_HINT));
      const list = el("ul", "share-list");
      for (const destination of options.destinations) {
        const row = el("li");
        const button = el("button", "share-link", pastePlaceLabel(destination.label));
        button.type = "button";
        button.disabled = captured === null;
        button.setAttribute("data-share-action", destination.id);
        button.addEventListener("click", () => {
          publishImage(destination.label, destination.href, button);
        });
        row.append(button);
        list.append(row);
      }
      panel.append(list);
      slot.append(panel);
    }
  }

  paint();
  void beginCapture().catch(() => {
    showNotice(imageShareNotice("failed", ""));
  });
}
