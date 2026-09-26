import { describe, expect, it } from "vitest";
import type { Verdict } from "./diagnosis/types";
import { shareMessage, shareTargets } from "./share";
import { PUBLIC_URL, shareDestinations } from "./share-destinations";

const VERDICTS: Verdict[] = ["loss", "risky", "ok"];

describe("shareMessage", () => {
  it("says this is my NISA diagnosis and names the verdict, without a URL", () => {
    expect(shareMessage("loss")).toBe(
      "NISA貧乏診断の結果は「今年の非課税枠を取りこぼしています」でした。",
    );
    expect(shareMessage("risky")).toBe(
      "NISA貧乏診断の結果は「NISAの使い方に確認したい点があります」でした。",
    );
    expect(shareMessage("ok")).toBe(
      "NISA貧乏診断の結果は「今年のNISA枠をおおむね活用できています」でした。",
    );
    const messages = VERDICTS.map((verdict) => shareMessage(verdict));
    expect(new Set(messages).size).toBe(VERDICTS.length);
    for (const message of messages) {
      expect(message.startsWith("NISA貧乏診断の結果は")).toBe(true);
      expect(message).not.toContain(PUBLIC_URL);
      expect(message).not.toContain("vercel.app");
      expect(message).not.toContain("http");
      expect(message).not.toContain("account");
      expect(message).not.toContain("quotaUse");
    }
  });

  it("passes that message to the shared destinations", () => {
    for (const verdict of VERDICTS) {
      expect(shareTargets(verdict)).toEqual(
        shareDestinations(shareMessage(verdict)),
      );
    }
  });
});
