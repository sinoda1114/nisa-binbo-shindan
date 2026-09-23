import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnose";
import {
  PUBLIC_PAGE_URL,
  linkToCopy,
  shareMessage,
  shareTargets,
} from "./share";
import type { Answers } from "./types";

const HEADLINE = "制度の理解に、誤解が残っている可能性があります";

describe("literacy share", () => {
  it("shares the headline and the public URL, and nothing else", () => {
    expect(shareMessage(HEADLINE).split("\n")).toEqual([
      HEADLINE,
      PUBLIC_PAGE_URL,
    ]);
    expect(linkToCopy()).toBe(PUBLIC_PAGE_URL);
    expect(PUBLIC_PAGE_URL).toBe("https://nisa-binbo-shindan.vercel.app");
  });

  it("opens X, LINE, Facebook, and Threads in that order", () => {
    const targets = shareTargets(HEADLINE);
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

    const message = shareMessage(HEADLINE);
    const x = new URL(targets[0]?.href ?? "");
    expect(x.origin + x.pathname).toBe("https://x.com/intent/post");
    expect(x.searchParams.get("text")).toBe(message);

    const line = targets[1]?.href ?? "";
    expect(line.startsWith("https://line.me/R/msg/text/?")).toBe(true);
    expect(line).toContain(encodeURIComponent(HEADLINE));
    expect(line).toContain(encodeURIComponent(PUBLIC_PAGE_URL));

    const facebook = new URL(targets[2]?.href ?? "");
    expect(facebook.origin + facebook.pathname).toBe(
      "https://www.facebook.com/sharer/sharer.php",
    );
    expect(facebook.searchParams.get("u")).toBe(PUBLIC_PAGE_URL);
    expect(facebook.searchParams.get("quote")).toBe(HEADLINE);

    const threads = new URL(targets[3]?.href ?? "");
    expect(threads.origin + threads.pathname).toBe(
      "https://www.threads.net/intent/post",
    );
    expect(threads.searchParams.get("text")).toBe(message);
  });

  it("does not put a diagnosed answer payload into the share links", () => {
    const answers: Answers = {
      purchasingPower: "nominal-only",
      compound: "principal-only",
      depositCover: "everything",
      accountFiling: "always-same",
      returnOfCapital: "extra-profit",
      nisaHolding: "still-capped",
      pensionDeferral: "flat",
      tsumitate: "always-up",
      trustFee: "purchase-only",
    };
    const headline = diagnose(answers).headline;
    const packed = shareTargets(headline)
      .map((target) => target.href)
      .join(" ");
    expect(packed).not.toContain("nominal-only");
    expect(packed).not.toContain("always-up");
    expect(shareMessage(headline)).not.toContain("purchase-only");
  });
});
