import { describe, expect, it } from "vitest";
import { QUESTIONS, isComplete } from "./quiz";

describe("QUESTIONS", () => {
  it("asks eleven distinct questions and does not ask whether a NISA account is open", () => {
    expect(QUESTIONS.map((question) => question.field)).toEqual([
      "quotaUse",
      "frameUse",
      "tsumitateAmount",
      "growthQuota",
      "recurring",
      "soldThisYear",
      "idleCash",
      "brokerCash",
      "taxableLeak",
      "sameBroker",
      "dividendRoute",
    ]);
    expect(QUESTIONS.map((question) => question.prompt)).not.toContain(
      "NISA口座は開設していますか。",
    );
    expect(QUESTIONS[2]).toMatchObject({
      field: "tsumitateAmount",
      prompt: "つみたて投資枠の定期買付は、月いくらくらいですか。",
      choices: [
        { value: "symbolic", label: "月数千円以下" },
        { value: "moderate", label: "月1万円前後" },
        { value: "filling", label: "年120万円に近い" },
        { value: "none", label: "つみたてはしていない" },
        { value: "unknown", label: "わからない" },
      ],
    });
    expect(QUESTIONS[3]).toMatchObject({
      field: "growthQuota",
      prompt: "成長投資枠（年240万円）は、今年どのくらい使っていますか。",
      choices: [
        { value: "none", label: "ほとんど使っていない" },
        { value: "some", label: "一部だけ" },
        { value: "most", label: "ほぼ使い切っている" },
        { value: "unknown", label: "わからない" },
      ],
    });
  });

  it("is complete only after every answer is present", () => {
    expect(
      isComplete({
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
      }),
    ).toBe(false);
    expect(
      isComplete({
        quotaUse: "most",
        frameUse: "both",
        tsumitateAmount: "moderate",
        growthQuota: "most",
        recurring: "running",
        soldThisYear: "not-sold",
        idleCash: "none",
        brokerCash: "none",
        taxableLeak: "no",
        sameBroker: "same",
        dividendRoute: "none",
      }),
    ).toBe(true);
  });
});
