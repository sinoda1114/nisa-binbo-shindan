import { describe, expect, it } from "vitest";
import { PUBLIC_URL, shareHref, shareMessage } from "./share";

const headline = "使い方として大きな取りこぼしは見当たりません";

describe("shareMessage", () => {
  it("includes only the headline and the public URL", () => {
    expect(shareMessage(headline)).toBe(`${headline}\n${PUBLIC_URL}`);
    expect(shareMessage(headline)).not.toContain("account");
    expect(shareMessage(headline)).not.toContain("quotaUse");
  });
});

describe("shareHref", () => {
  it("opens X, LINE, Facebook, and Threads with the headline and URL", () => {
    const x = decodeURIComponent(shareHref("x", headline));
    const line = decodeURIComponent(shareHref("line", headline));
    const facebook = decodeURIComponent(shareHref("facebook", headline));
    const threads = decodeURIComponent(shareHref("threads", headline));

    expect(x.startsWith("https://x.com/intent/post?text=")).toBe(true);
    expect(line.startsWith("https://line.me/R/msg/text/?")).toBe(true);
    expect(facebook.startsWith("https://www.facebook.com/sharer/sharer.php?")).toBe(
      true,
    );
    expect(threads.startsWith("https://www.threads.net/intent/post?text=")).toBe(
      true,
    );

    for (const href of [x, line, facebook, threads]) {
      expect(href).toContain(headline);
      expect(href).toContain(PUBLIC_URL);
      expect(href).not.toContain("taxableLeak");
    }
  });
});
