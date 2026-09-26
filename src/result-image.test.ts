import { describe, expect, it, vi } from "vitest";
import {
  deliverResultPng,
  downloadBlob,
  imageShareNotice,
  pastePlaceLabel,
  shouldAttemptClipboardWrite,
  startPngClipboardWrite,
  type ClipboardWriteItem,
  type ImageOutcome,
  type PngClipboard,
} from "./result-image";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function pngBlob(): Blob {
  return new Blob([new Uint8Array(PNG_SIGNATURE)], { type: "image/png" });
}

class RecordingItem implements ClipboardWriteItem {
  readonly types: readonly string[];

  constructor(private readonly data: Record<string, Blob | Promise<Blob>>) {
    this.types = Object.keys(data);
  }

  async getType(type: string): Promise<Blob> {
    const value = this.data[type];
    if (!value) {
      throw new Error(`missing ${type}`);
    }
    return value instanceof Blob ? value : await value;
  }
}

function recordingClipboard(write: PngClipboard["write"]): PngClipboard {
  return {
    createItem: (items) => new RecordingItem(items),
    write,
  };
}

describe("imageShareNotice", () => {
  it("tells the person to paste the copied image, without claiming it is attached", () => {
    const places = ["", "X", "LINE", "Facebook", "Threads"];
    const outcomes: ImageOutcome[] = ["copied", "saved", "failed"];
    for (const place of places) {
      for (const outcome of outcomes) {
        const text = imageShareNotice(outcome, place);
        expect(text).not.toContain("添付しました");
        expect(text).not.toContain("画像を載せました");
        expect(text).not.toContain("image/png");
      }
    }
    expect(imageShareNotice("copied", "")).toBe(
      "画像をコピーしました。投稿欄に貼り付けてください。",
    );
    expect(imageShareNotice("copied", "X")).toBe(
      "画像をコピーしました。開いたXの投稿画面に貼り付けてください。",
    );
    expect(imageShareNotice("saved", "LINE")).toBe(
      "画像を保存しました。LINEでは、保存した画像を添付してください。",
    );
    expect(imageShareNotice("copied", "X")).not.toContain("シェアには");
    expect(imageShareNotice("saved", "LINE")).not.toContain("シェアには");
    expect(imageShareNotice("failed", "Threads")).toBe("画像を用意できませんでした。");
  });
});

describe("shouldAttemptClipboardWrite", () => {
  it("skips the clipboard when write permission is denied so a download can still start", () => {
    expect(shouldAttemptClipboardWrite("denied")).toBe(false);
    expect(shouldAttemptClipboardWrite("granted")).toBe(true);
    expect(shouldAttemptClipboardWrite("prompt")).toBe(true);
    expect(shouldAttemptClipboardWrite("unknown")).toBe(true);
  });
});

describe("pastePlaceLabel", () => {
  it("names the post screen after the image copy", () => {
    expect(pastePlaceLabel("X")).toBe("Xでシェアする");
    expect(pastePlaceLabel("LINE")).toBe("LINEでシェアする");
    expect(pastePlaceLabel("Facebook")).toBe("Facebookでシェアする");
    expect(pastePlaceLabel("Threads")).toBe("Threadsでシェアする");
  });
});

describe("startPngClipboardWrite", () => {
  it("builds an image/png clipboard item before the png resolves", async () => {
    let created = false;
    let resolveBlob: (blob: Blob) => void = () => {};
    const png = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });
    let item: ClipboardWriteItem | null = null;
    const pending = startPngClipboardWrite(png, {
      createItem: (items) => {
        created = true;
        expect(Object.keys(items)).toEqual(["image/png"]);
        item = new RecordingItem(items);
        return item;
      },
      write: async () => {},
    });
    expect(created).toBe(true);
    resolveBlob(pngBlob());
    await pending;
    const written = item as ClipboardWriteItem | null;
    expect(written?.types).toContain("image/png");
    const blob = await written?.getType("image/png");
    expect(blob?.type).toBe("image/png");
    expect(Array.from(new Uint8Array(await blob!.arrayBuffer()))).toEqual(PNG_SIGNATURE);
  });
});

describe("deliverResultPng", () => {
  it("keeps the png on the clipboard and does not download it", async () => {
    const download = vi.fn();
    const received: ClipboardWriteItem[] = [];
    const outcome = await deliverResultPng({
      png: Promise.resolve(pngBlob()),
      filename: "nisa-binbo-kekka.png",
      clipboard: recordingClipboard(async (items) => {
        const first = items[0];
        if (first) {
          received.push(first);
        }
      }),
      download,
    });
    expect(outcome).toBe("copied");
    expect(download).not.toHaveBeenCalled();
    expect(received[0]?.types).toContain("image/png");
  });

  it("downloads the same png when the clipboard rejects the write", async () => {
    const download = vi.fn((_blob: Blob, _filename: string) => true);
    const outcome = await deliverResultPng({
      png: Promise.resolve(pngBlob()),
      filename: "literacy-kekka.png",
      clipboard: recordingClipboard(async () => {
        throw new Error("NotAllowedError");
      }),
      download,
    });
    expect(outcome).toBe("saved");
    expect(download).toHaveBeenCalledTimes(1);
    const blob = download.mock.calls[0]?.[0] as Blob;
    expect(download.mock.calls[0]?.[1]).toBe("literacy-kekka.png");
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual(PNG_SIGNATURE);
  });

  it("reports failure when the download cannot start", async () => {
    const outcome = await deliverResultPng({
      png: Promise.resolve(pngBlob()),
      filename: "nisa-binbo-kekka.png",
      clipboard: null,
      download: () => false,
    });
    expect(outcome).toBe("failed");
  });

  it("saves a ready png before opening the post screen", async () => {
    const order: string[] = [];
    const pending = deliverResultPng({
      png: pngBlob(),
      filename: "nisa-binbo-kekka.png",
      clipboard: null,
      download: () => {
        order.push("download");
        return true;
      },
      opened: () => {
        order.push("open");
      },
    });
    expect(order).toEqual(["download", "open"]);
    await expect(pending).resolves.toBe("saved");
  });

  it("opens the post screen once when the clipboard write fails", async () => {
    let opens = 0;
    const outcome = await deliverResultPng({
      png: pngBlob(),
      filename: "literacy-kekka.png",
      clipboard: recordingClipboard(async () => {
        throw new Error("NotAllowedError");
      }),
      download: () => true,
      opened: () => {
        opens += 1;
      },
    });
    expect(outcome).toBe("saved");
    expect(opens).toBe(1);
  });

  it("counts the download after the post screen consumes activation", async () => {
    const clicks: string[] = [];
    vi.stubGlobal("document", {
      body: { append() {} },
      createElement() {
        return {
          href: "",
          download: "",
          rel: "",
          click() {
            clicks.push("click");
          },
          remove() {},
        };
      },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:result",
      revokeObjectURL: () => {},
    });
    vi.stubGlobal("window", { setTimeout: () => 0 });
    vi.stubGlobal("navigator", { userActivation: { isActive: false } });
    try {
      const outcome = await deliverResultPng({
        png: pngBlob(),
        filename: "nisa-binbo-kekka.png",
        clipboard: recordingClipboard(async () => {
          throw new Error("NotAllowedError");
        }),
        download: downloadBlob,
        opened: () => {},
      });
      expect(clicks).toEqual(["click"]);
      expect(outcome).toBe("saved");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("downloads when image clipboard write is unavailable", async () => {
    const download = vi.fn(() => true);
    const outcome = await deliverResultPng({
      png: Promise.resolve(pngBlob()),
      filename: "nisa-binbo-kekka.png",
      clipboard: null,
      download,
    });
    expect(outcome).toBe("saved");
    expect(download).toHaveBeenCalledTimes(1);
  });
});
