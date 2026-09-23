import { describe, expect, it } from "vitest";
import type { Verdict } from "./diagnosis/types";
import { shareMessage, shareTargets } from "./share";
import { PUBLIC_URL, shareDestinations } from "./share-destinations";

const VERDICTS: Verdict[] = ["loss", "risky", "ok"];

describe("shareMessage", () => {
  it("says this is my NISA diagnosis and names the verdict, without a URL", () => {
    expect(shareMessage("loss")).toBe(
      "私のNISA貧乏診断です。非課税の枠を、取りこぼしている判定です。",
    );
    expect(shareMessage("risky")).toBe(
      "私のNISA貧乏診断です。使い方は、あと一歩で惜しい判定です。",
    );
    expect(shareMessage("ok")).toBe(
      "私のNISA貧乏診断です。今年の枠は、使えている判定です。",
    );
    const messages = VERDICTS.map((verdict) => shareMessage(verdict));
    expect(new Set(messages).size).toBe(VERDICTS.length);
    for (const message of messages) {
      expect(message.startsWith("私のNISA貧乏診断です")).toBe(true);
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
