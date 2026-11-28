import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnose";
import { utilizationLevel, utilizationMarks } from "./level";
import type { Answers, Finding, FindingSeverity, Verdict } from "./types";

const NEUTRAL = {
  quotaPlan: "use",
  recurring: "running",
  soldThisYear: "not-sold",
  brokerCash: "none",
  sameBroker: "same",
  dividendRoute: "none",
} as const satisfies Pick<
  Answers,
  | "quotaPlan"
  | "recurring"
  | "soldThisYear"
  | "brokerCash"
  | "sameBroker"
  | "dividendRoute"
>;

function fill(
  answers: Omit<Answers, keyof typeof NEUTRAL> &
    Partial<Pick<Answers, keyof typeof NEUTRAL>>,
): Answers {
  return { ...NEUTRAL, ...answers };
}

function finding(severity: FindingSeverity): Finding {
  return {
    id: "unused-quota",
    severity,
    title: "所見",
    detail: "詳細",
  };
}

function rated(verdict: Verdict, severities: readonly FindingSeverity[]) {
  return {
    verdict,
    findings: severities.map((severity) => finding(severity)),
  };
}

describe("utilizationLevel", () => {
  it("maps each verdict and finding count onto one of five levels", () => {
    expect(utilizationLevel(rated("ok", []))).toBe(5);
    expect(utilizationMarks(5)).toBe("★★★★★");

    expect(utilizationLevel(rated("risky", ["risk"]))).toBe(4);
    expect(utilizationMarks(4)).toBe("★★★★☆");

    expect(utilizationLevel(rated("risky", ["risk", "risk"]))).toBe(3);
    expect(utilizationMarks(3)).toBe("★★★☆☆");

    expect(utilizationLevel(rated("loss", ["loss"]))).toBe(2);
    expect(utilizationMarks(2)).toBe("★★☆☆☆");

    expect(utilizationLevel(rated("loss", ["loss", "loss"]))).toBe(1);
    expect(utilizationMarks(1)).toBe("★☆☆☆☆");
  });

  it("counts only the severity that matches the verdict", () => {
    expect(utilizationLevel(rated("risky", ["risk", "loss", "loss"]))).toBe(4);
    expect(utilizationLevel(rated("loss", ["loss", "risk", "risk"]))).toBe(2);
    expect(
      utilizationLevel(rated("loss", ["loss", "loss", "risk"])),
    ).toBe(1);
  });

  it("reads those five levels from diagnose findings", () => {
    expect(
      utilizationLevel(
        diagnose(
          fill({
            quotaUse: "most",
            frameUse: "both",
            idleCash: "none",
            taxableLeak: "no",
          }),
        ),
      ),
    ).toBe(5);
    expect(
      utilizationLevel(
        diagnose(
          fill({
            quotaUse: "most",
            frameUse: "none",
            idleCash: "none",
            taxableLeak: "no",
          }),
        ),
      ),
    ).toBe(4);
    expect(
      utilizationLevel(
        diagnose(
          fill({
            quotaUse: "some",
            frameUse: "tsumitate",
            idleCash: "some",
            taxableLeak: "no",
          }),
        ),
      ),
    ).toBe(3);
    expect(
      utilizationLevel(
        diagnose(
          fill({
            quotaUse: "most",
            frameUse: "both",
            idleCash: "none",
            taxableLeak: "no",
            soldThisYear: "stopped",
          }),
        ),
      ),
    ).toBe(2);
    expect(
      utilizationLevel(
        diagnose(
          fill({
            quotaUse: "most",
            frameUse: "both",
            idleCash: "none",
            taxableLeak: "no",
            soldThisYear: "stopped",
            dividendRoute: "other",
          }),
        ),
      ),
    ).toBe(1);
  });
});
