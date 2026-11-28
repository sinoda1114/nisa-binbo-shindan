import { describe, expect, it } from "vitest";
import type { Finding, FindingSeverity, Verdict } from "./diagnosis/types";
import { shareMessage, shareTargets } from "./share";
import { PUBLIC_URL, shareDestinations } from "./share-destinations";

const CASES: readonly {
  verdict: Verdict;
  severities: readonly FindingSeverity[];
  message: string;
}[] = [
  {
    verdict: "ok",
    severities: [],
    message:
      "NISA貧乏診断の結果は「今年のNISA枠をおおむね活用できています」でした。 ★★★★★",
  },
  {
    verdict: "risky",
    severities: ["risk"],
    message:
      "NISA貧乏診断の結果は「NISAの使い方に確認したい点があります」でした。 ★★★★☆",
  },
  {
    verdict: "risky",
    severities: ["risk", "risk"],
    message:
      "NISA貧乏診断の結果は「NISAの使い方に確認したい点があります」でした。 ★★★☆☆",
  },
  {
    verdict: "loss",
    severities: ["loss"],
    message:
      "NISA貧乏診断の結果は「今年の非課税枠を取りこぼしています」でした。 ★★☆☆☆",
  },
  {
    verdict: "loss",
    severities: ["loss", "loss"],
    message:
      "NISA貧乏診断の結果は「今年の非課税枠を取りこぼしています」でした。 ★☆☆☆☆",
  },
];

function finding(severity: FindingSeverity): Finding {
  return {
    id: "unused-quota",
    severity,
    title: "所見",
    detail: "詳細",
  };
}

function diagnosis(verdict: Verdict, severities: readonly FindingSeverity[]) {
  return {
    verdict,
    findings: severities.map((severity) => finding(severity)),
  };
}

describe("shareMessage", () => {
  it("names the verdict and appends the same five-star row, without a URL", () => {
    const messages = CASES.map(({ verdict, severities, message }) => {
      const text = shareMessage(diagnosis(verdict, severities));
      expect(text).toBe(message);
      return text;
    });
    expect(new Set(messages).size).toBe(CASES.length);
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
    for (const { verdict, severities } of CASES) {
      const sample = diagnosis(verdict, severities);
      expect(shareTargets(sample)).toEqual(
        shareDestinations(shareMessage(sample)),
      );
    }
  });
});
