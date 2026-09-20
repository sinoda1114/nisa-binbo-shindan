import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnose";
import type { Answers, FindingId, Verdict } from "./types";

function idsOf(answers: Answers): FindingId[] {
  return diagnose(answers).findings.map((finding) => finding.id);
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

describe("diagnose", () => {
  it("marks opened, full-ish usage as ok with no findings", () => {
    const result = diagnose({
      account: "opened",
      quotaUse: "most",
      frameUse: "both",
      idleCash: "none",
      taxableLeak: "no",
    });
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe(
      "使い方として大きな取りこぼしは見当たりません",
    );
  });

  it("marks no account plus lots of idle cash as loss", () => {
    expectDiagnosis(
      {
        account: "none",
        quotaUse: "unknown",
        frameUse: "unsure",
        idleCash: "lots",
        taxableLeak: "unknown",
      },
      "loss",
      ["no-account", "idle-cash-lots"],
    );
  });

  it("stacks unused quota, idle cash, taxable leak, and unsure frames as loss", () => {
    expectDiagnosis(
      {
        account: "opened",
        quotaUse: "none",
        frameUse: "unsure",
        idleCash: "lots",
        taxableLeak: "yes",
      },
      "loss",
      [
        "unused-quota",
        "idle-cash-lots",
        "taxable-while-quota-left",
        "frame-unsure",
      ],
    );
  });

  it("marks partial quota and some idle cash as risky without unused-quota", () => {
    const answers: Answers = {
      account: "opened",
      quotaUse: "some",
      frameUse: "tsumitate",
      idleCash: "some",
      taxableLeak: "no",
    };
    expectDiagnosis(answers, "risky", ["partial-quota", "idle-cash-some"]);
    expect(idsOf(answers)).not.toContain("unused-quota");
  });

  it("marks growth-centered use as the only finding when quota is mostly used", () => {
    expectDiagnosis(
      {
        account: "opened",
        quotaUse: "most",
        frameUse: "growth",
        idleCash: "none",
        taxableLeak: "no",
      },
      "risky",
      ["growth-without-tsumitate"],
    );
  });

  it("marks planning-only as the only finding", () => {
    expectDiagnosis(
      {
        account: "planning",
        quotaUse: "unknown",
        frameUse: "none",
        idleCash: "none",
        taxableLeak: "unknown",
      },
      "risky",
      ["planning-only"],
    );
  });

  it("does not fire idle-cash-lots when the account is opened and quota is mostly used", () => {
    const result = diagnose({
      account: "opened",
      quotaUse: "most",
      frameUse: "tsumitate",
      idleCash: "lots",
      taxableLeak: "no",
    });
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe(
      "使い方として大きな取りこぼしは見当たりません",
    );
  });

  it("treats unknown quota as possibly left, not as mostly used", () => {
    expectDiagnosis(
      {
        account: "opened",
        quotaUse: "unknown",
        frameUse: "both",
        idleCash: "lots",
        taxableLeak: "yes",
      },
      "loss",
      ["unknown-quota", "idle-cash-lots", "taxable-while-quota-left"],
    );
  });

  it("marks unknown quota alone as risky, not ok", () => {
    expectDiagnosis(
      {
        account: "opened",
        quotaUse: "unknown",
        frameUse: "tsumitate",
        idleCash: "none",
        taxableLeak: "no",
      },
      "risky",
      ["unknown-quota"],
    );
  });
});
