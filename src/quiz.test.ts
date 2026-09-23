import { describe, expect, it } from "vitest";
import { QUESTIONS, isComplete } from "./quiz";

describe("QUESTIONS", () => {
  it("asks ten distinct questions about how NISA is used", () => {
    expect(QUESTIONS.map((question) => question.field)).toEqual([
      "account",
      "quotaUse",
      "frameUse",
      "recurring",
      "soldThisYear",
      "idleCash",
      "brokerCash",
      "taxableLeak",
      "sameBroker",
      "dividendRoute",
    ]);
  });

  it("is complete only after every answer is present", () => {
    expect(
      isComplete({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
      }),
    ).toBe(false);
    expect(
      isComplete({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
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
