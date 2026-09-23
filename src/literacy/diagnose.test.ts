import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnose";
import { shareMessage } from "./share";
import type { Answers, FindingId, Verdict } from "./types";

const ANSWER_SLUGS = [
  "real-can-fall",
  "nominal-only",
  "on-interest",
  "principal-only",
  "capped-yen",
  "everything",
  "withholding-optional",
  "always-same",
  "reduces-basis",
  "extra-profit",
  "unlimited",
  "still-capped",
  "rises-monthly",
  "not-guaranteed",
  "always-up",
  "ongoing",
  "purchase-only",
] as const;

function solidAnswers(): Answers {
  return {
    purchasingPower: "real-can-fall",
    compound: "on-interest",
    depositCover: "capped-yen",
    accountFiling: "withholding-optional",
    returnOfCapital: "reduces-basis",
    nisaHolding: "unlimited",
    pensionDeferral: "rises-monthly",
    tsumitate: "not-guaranteed",
    trustFee: "ongoing",
  };
}

function wrongAnswers(): Answers {
  return {
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
}

function unknownAnswers(): Answers {
  return {
    purchasingPower: "unknown",
    compound: "unknown",
    depositCover: "unknown",
    accountFiling: "unknown",
    returnOfCapital: "unknown",
    nisaHolding: "unknown",
    pensionDeferral: "unknown",
    tsumitate: "unknown",
    trustFee: "unknown",
  };
}

function expectDiagnosis(
  answers: Answers,
  verdict: Verdict,
  findingIds: FindingId[],
) {
  const result = diagnose(answers);
  expect(result.verdict).toBe(verdict);
  expect(result.findings.map((finding) => finding.id)).toEqual(findingIds);
}

describe("literacy diagnose", () => {
  it("marks a full set of accurate answers as solid with no findings", () => {
    const result = diagnose(solidAnswers());
    expect(result.verdict).toBe("solid");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe("今回の範囲では、大きな誤解は見当たりません");
  });

  it("marks one wrong answer as gap and does not also mark that field unknown", () => {
    const answers = solidAnswers();
    answers.depositCover = "everything";
    expectDiagnosis(answers, "gap", ["deposit-cover-wrong"]);
  });

  it("marks one unknown answer as shaky", () => {
    const answers = solidAnswers();
    answers.trustFee = "unknown";
    expectDiagnosis(answers, "shaky", ["trust-fee-unknown"]);
  });

  it("lets a wrong answer outweigh unknown answers", () => {
    const answers = unknownAnswers();
    answers.compound = "principal-only";
    expectDiagnosis(answers, "gap", [
      "purchasing-power-unknown",
      "compound-wrong",
      "deposit-cover-unknown",
      "account-filing-unknown",
      "return-of-capital-unknown",
      "nisa-holding-unknown",
      "pension-deferral-unknown",
      "tsumitate-unknown",
      "trust-fee-unknown",
    ]);
  });

  it("lists every wrong answer in rule order", () => {
    expectDiagnosis(wrongAnswers(), "gap", [
      "purchasing-power-wrong",
      "compound-wrong",
      "deposit-cover-wrong",
      "account-filing-wrong",
      "return-of-capital-wrong",
      "nisa-holding-wrong",
      "pension-deferral-wrong",
      "tsumitate-wrong",
      "trust-fee-wrong",
    ]);
  });

  it("lists every unknown answer as shaky, without calling them wrong", () => {
    expectDiagnosis(unknownAnswers(), "shaky", [
      "purchasing-power-unknown",
      "compound-unknown",
      "deposit-cover-unknown",
      "account-filing-unknown",
      "return-of-capital-unknown",
      "nisa-holding-unknown",
      "pension-deferral-unknown",
      "tsumitate-unknown",
      "trust-fee-unknown",
    ]);
  });

  it("keeps answer slugs out of the headline, summary, and share text", () => {
    const result = diagnose(wrongAnswers());
    const shared = shareMessage(result.headline);
    for (const slug of ANSWER_SLUGS) {
      expect(result.headline).not.toContain(slug);
      expect(result.summary).not.toContain(slug);
      expect(shared).not.toContain(slug);
      for (const finding of result.findings) {
        expect(finding.title).not.toContain(slug);
        expect(finding.detail).not.toContain(slug);
      }
    }
  });
});
