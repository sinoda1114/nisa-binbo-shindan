import { describe, expect, it } from "vitest";
import {
  PUBLIC_URL,
  linkToCopy,
  shareDestinations,
} from "./share-destinations";

const MESSAGE = "私のNISA貧乏診断です。使い方は、あと一歩で惜しい判定です。";

describe("shareDestinations", () => {
  it("opens X, LINE, Facebook, and Threads with the message and no page URL", () => {
    const targets = shareDestinations(MESSAGE);
    expect(targets.map((target) => target.label)).toEqual([
      "X",
      "LINE",
      "Facebook",
      "Threads",
    ]);
    expect(targets.map((target) => target.id)).toEqual([
      "x",
      "line",
      "facebook",
      "threads",
    ]);

    const x = new URL(targets[0]?.href ?? "");
    expect(x.origin + x.pathname).toBe("https://x.com/intent/post");
    expect(x.searchParams.get("text")).toBe(MESSAGE);
    expect(x.searchParams.get("url")).toBeNull();

    const line = targets[1]?.href ?? "";
    expect(line.startsWith("https://line.me/R/msg/text/?")).toBe(true);
    expect(decodeURIComponent(line)).toContain(MESSAGE);

    const facebook = new URL(targets[2]?.href ?? "");
    expect(facebook.origin + facebook.pathname).toBe(
      "https://www.facebook.com/sharer/sharer.php",
    );
    expect(facebook.searchParams.get("quote")).toBe(MESSAGE);
    expect(facebook.searchParams.get("u")).toBeNull();
    expect(facebook.searchParams.get("url")).toBeNull();

    const threads = new URL(targets[3]?.href ?? "");
    expect(threads.origin + threads.pathname).toBe(
      "https://www.threads.net/intent/post",
    );
    expect(threads.searchParams.get("text")).toBe(MESSAGE);
    expect(threads.searchParams.get("url")).toBeNull();

    const packed = targets.map((target) => target.href).join(" ");
    expect(packed).not.toContain(PUBLIC_URL);
    expect(packed).not.toContain("vercel.app");
    expect(packed).not.toContain("image/png");
    expect(packed).not.toContain("data:");
    expect(packed).not.toMatch(/[?&](media|image|attachment|url)=/);
  });
});

describe("linkToCopy", () => {
  it("is the public page and nothing else", () => {
    expect(linkToCopy()).toBe(PUBLIC_URL);
    expect(PUBLIC_URL).toBe("https://nisa-binbo-shindan.vercel.app");
  });
});
