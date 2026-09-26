import { domToBlob } from "modern-screenshot";

export const PAPER = "#f6f1e6";
export const NISA_IMAGE_NAME = "nisa-binbo-kekka.png";
export const LITERACY_IMAGE_NAME = "literacy-kekka.png";

const FONT_STYLE_ATTR = "data-result-fonts";

export type ImageOutcome = "copied" | "saved" | "failed";

export type ClipboardWriteItem = {
  readonly types: readonly string[];
  getType: (type: string) => Promise<Blob>;
};

export type PngClipboard = {
  createItem: (items: Record<string, Blob | Promise<Blob>>) => ClipboardWriteItem;
  write: (items: readonly ClipboardWriteItem[]) => Promise<void>;
};

export function imageShareNotice(outcome: ImageOutcome, place: string): string {
  switch (outcome) {
    case "failed":
      return "画像を用意できませんでした。";
    case "copied":
      if (place.length > 0) {
        return `画像をコピーしました。開いた${place}の投稿画面に貼り付けてください。`;
      }
      return "画像をコピーしました。投稿欄に貼り付けてください。";
    case "saved":
      if (place.length > 0) {
        return `画像を保存しました。${place}では、保存した画像を添付してください。`;
      }
      return "画像を保存しました。投稿欄に添付してください。";
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}

export function pastePlaceLabel(name: string): string {
  return `${name}でシェアする`;
}

let clipboardWriteState = "unknown";

export function shouldAttemptClipboardWrite(state: string): boolean {
  return state !== "denied";
}

export function noteClipboardPermission(): void {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return;
  }
  void navigator.permissions
    .query({ name: "clipboard-write" as PermissionName })
    .then((status) => {
      clipboardWriteState = status.state;
      status.onchange = () => {
        clipboardWriteState = status.state;
      };
    })
    .catch(() => {
      clipboardWriteState = "unknown";
    });
}

export function readPngClipboard(): PngClipboard | null {
  if (!shouldAttemptClipboardWrite(clipboardWriteState)) {
    return null;
  }
  if (typeof ClipboardItem === "undefined") {
    return null;
  }
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.write !== "function") {
    return null;
  }
  return {
    createItem: (items) => new ClipboardItem(items),
    write: (items) => {
      const real: ClipboardItem[] = [];
      for (const item of items) {
        if (!(item instanceof ClipboardItem)) {
          return Promise.reject(new Error("画像をクリップボードに載せられません"));
        }
        real.push(item);
      }
      return clipboard.write(real);
    },
  };
}

export function startPngClipboardWrite(
  png: Promise<Blob>,
  clipboard: PngClipboard,
): Promise<void> {
  const item = clipboard.createItem({
    "image/png": png.then((blob) =>
      blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" }),
    ),
  });
  return clipboard.write([item]);
}

export function downloadBlob(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}

export function deliverResultPng(options: {
  png: Blob | Promise<Blob>;
  filename: string;
  clipboard: PngClipboard | null;
  download: (blob: Blob, filename: string) => boolean;
  opened?: () => void;
}): Promise<ImageOutcome> {
  const pngPromise = options.png instanceof Blob ? Promise.resolve(options.png) : options.png;

  function saveBlob(blob: Blob, open: boolean): ImageOutcome {
    const outcome = options.download(blob, options.filename) ? "saved" : "failed";
    if (open && outcome === "saved") {
      options.opened?.();
    }
    return outcome;
  }

  function save(open: boolean): Promise<ImageOutcome> {
    return pngPromise.then(
      (blob) => saveBlob(blob, open),
      () => "failed",
    );
  }

  if (!options.clipboard) {
    if (!(options.png instanceof Blob)) {
      options.opened?.();
      return pngPromise.then(
        (blob) =>
          navigator.userActivation?.isActive === false ? "failed" : saveBlob(blob, false),
        () => "failed",
      );
    }
    return Promise.resolve(saveBlob(options.png, true));
  }
  let pending: Promise<void>;
  try {
    pending = startPngClipboardWrite(pngPromise, options.clipboard);
  } catch {
    return save(true);
  }
  options.opened?.();
  return pending.then(
    () => "copied",
    () => save(false),
  );
}

let fontCssPromise: Promise<void> | null = null;

export function ensureResultFonts(): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  if (document.head.querySelector(`style[${FONT_STYLE_ATTR}]`)) {
    return Promise.resolve();
  }
  if (!fontCssPromise) {
    fontCssPromise = loadResultFonts().catch(() => {
      fontCssPromise = null;
    });
  }
  return fontCssPromise;
}

async function loadResultFonts(): Promise<void> {
  const link = document.querySelector(
    'link[rel="stylesheet"][href*="fonts.googleapis.com"]',
  );
  if (!(link instanceof HTMLLinkElement) || link.href.length === 0) {
    return;
  }
  const response = await fetch(link.href);
  if (!response.ok) {
    return;
  }
  const css = await response.text();
  if (css.length === 0 || document.head.querySelector(`style[${FONT_STYLE_ATTR}]`)) {
    return;
  }
  const style = document.createElement("style");
  style.setAttribute(FONT_STYLE_ATTR, "");
  style.textContent = css;
  document.head.append(style);
}

export function paperWithoutControls(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error("結果の紙を写せません");
  }
  clone.querySelectorAll("button, [data-share]").forEach((node) => {
    node.remove();
  });
  const nodes: HTMLElement[] = [clone];
  clone.querySelectorAll("*").forEach((node) => {
    if (node instanceof HTMLElement) {
      nodes.push(node);
    }
  });
  for (const node of nodes) {
    node.style.animation = "none";
  }
  return clone;
}

export function captureResultPng(source: HTMLElement): Promise<Blob> {
  const width = Math.max(1, Math.round(source.getBoundingClientRect().width));
  const clone = paperWithoutControls(source);
  clone.style.width = `${width}px`;
  clone.style.margin = "0";
  const host = document.createElement("div");
  host.setAttribute("data-capture-host", "");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.pointerEvents = "none";
  host.append(clone);
  document.body.append(host);
  return finishCapture(clone, host);
}

async function finishCapture(clone: HTMLElement, host: HTMLElement): Promise<Blob> {
  try {
    await ensureResultFonts();
    if (document.fonts) {
      await document.fonts.ready;
    }
    const height = clone.getBoundingClientRect().height;
    const scale = height * 2 > 16000 ? 1 : 2;
    const blob = await domToBlob(clone, {
      scale,
      backgroundColor: PAPER,
      type: "image/png",
    });
    if (blob.size === 0) {
      throw new Error("画像が空です");
    }
    return blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
  } finally {
    host.remove();
  }
}
