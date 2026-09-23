import { describe, expect, it } from "vitest";
import { shareDestinations } from "../share-destinations";
import { diagnose } from "./diagnose";
import {
  PUBLIC_PAGE_URL,
  linkToCopy,
  shareMessage,
  shareTargets,
} from "./share";
import type { Answers, Verdict } from "./types";

const VERDICTS: Verdict[] = ["gap", "shaky", "solid"];

describe("literacy share", () => {
  it("says this is my literacy diagnosis, and keeps the URL for the link copy only", () => {
    expect(shareMessage("gap")).toBe(
      "私の金融リテラシー診断です。誤解がありそう、という結果です。",
    );
    expect(shareMessage("shaky")).toBe(
      "私の金融リテラシー診断です。確認した方がよさそう、という結果です。",
    );
    expect(shareMessage("solid")).toBe(
      "私の金融リテラシー診断です。概ね合っている、という結果です。",
    );
    expect(linkToCopy()).toBe(PUBLIC_PAGE_URL);
    for (const verdict of VERDICTS) {
      const message = shareMessage(verdict);
      expect(message.startsWith("私の金融リテラシー診断です")).toBe(true);
      expect(message).not.toContain("NISA貧乏");
      expect(message).not.toContain(PUBLIC_PAGE_URL);
      expect(message).not.toContain("http");
      expect(shareTargets(verdict)).toEqual(shareDestinations(message));
    }
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
    const verdict = diagnose(answers).verdict;
    const packed = shareTargets(verdict)
      .map((target) => target.href)
      .join(" ");
    expect(packed).not.toContain("nominal-only");
    expect(packed).not.toContain("always-up");
    expect(shareMessage(verdict)).not.toContain("purchase-only");
  });
});
