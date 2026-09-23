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
  let captured: Blob | null = null;

  slot.classList.add("share");

  function beginCapture(): Promise<Blob> {
    if (captured) {
      return Promise.resolve(captured);
    }
    if (!capture) {
      capture = captureResultPng(options.paper)
        .then((blob) => {
          captured = blob;
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
    if (button.isConnected) {
      button.focus({ preventScroll: true });
    }
  }

  function setBusy(value: boolean) {
    busy = value;
    slot.querySelectorAll("button").forEach((node) => {
      if (!(node instanceof HTMLButtonElement)) {
        return;
      }
      const waitsForImage = node.classList.contains("share-link");
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

  function publishImage(place: string, href: string | null, pressed: HTMLButtonElement) {
    if (busy) {
      return;
    }
    const ready = captured;
    setBusy(true);
    if (!ready) {
      slot.setAttribute("data-pending-share", "");
      showNotice("画像を写しています。");
    }
    const pending = deliverResultPng({
      png: ready ?? beginCapture(),
      filename: options.filename,
      clipboard: readPngClipboard(),
      download: downloadBlob,
      ...(href
        ? {
            opened: () => {
              window.open(href, "_blank", "noopener,noreferrer");
            },
          }
        : {}),
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

    const toggle = el("button", "btn btn-share", "投稿画面を開く");
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
      const next = open
        ? slot.querySelector(".share-list button")
        : slot.querySelector(".btn-share");
      if (next instanceof HTMLElement) {
        next.focus({ preventScroll: true });
      }
    });

    slot.append(copyImage, status, toggle);
    if (open) {
      const panel = el("div", "share-panel");
      panel.id = "share-destinations";
      panel.append(
        el(
          "p",
          "share-hint",
          "投稿画面に画像は付きません。開いたあと、コピーした画像を貼り付けてください。",
        ),
      );
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
  }

  paint();
  void beginCapture().catch(() => {
    showNotice(imageShareNotice("failed", ""));
  });
}
