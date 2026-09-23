import { describe, expect, it } from "vitest";
import { diagnose } from "./diagnose";
import type { Answers, FindingId, Verdict } from "./types";

const NEUTRAL = {
  recurring: "running",
  soldThisYear: "not-sold",
  brokerCash: "none",
  sameBroker: "same",
  dividendRoute: "none",
} as const satisfies Pick<
  Answers,
  "recurring" | "soldThisYear" | "brokerCash" | "sameBroker" | "dividendRoute"
>;

function fill(
  answers: Omit<Answers, keyof typeof NEUTRAL> &
    Partial<Pick<Answers, keyof typeof NEUTRAL>>,
): Answers {
  return { ...NEUTRAL, ...answers };
}

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
    const result = diagnose(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
      }),
    );
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe("今年の枠、ちゃんと座れてます");
  });

  it("marks no account plus lots of idle cash as loss", () => {
    const answers = fill({
      account: "none",
      quotaUse: "unknown",
      frameUse: "unsure",
      idleCash: "lots",
      taxableLeak: "unknown",
    });
    expectDiagnosis(answers, "loss", ["no-account", "idle-cash-lots"]);
    expect(diagnose(answers).headline).toBe("非課税の席、空席の気配です");
  });

  it("stacks unused quota, idle cash, taxable leak, and unsure frames as loss", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "none",
        frameUse: "unsure",
        idleCash: "lots",
        taxableLeak: "yes",
      }),
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
    const answers = fill({
      account: "opened",
      quotaUse: "some",
      frameUse: "tsumitate",
      idleCash: "some",
      taxableLeak: "no",
    });
    expectDiagnosis(answers, "risky", ["partial-quota", "idle-cash-some"]);
    expect(diagnose(answers).headline).toBe("使い方、あと一歩で惜しいです");
    expect(idsOf(answers)).not.toContain("unused-quota");
  });

  it("marks growth-centered use as the only finding when quota is mostly used", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "growth",
        idleCash: "none",
        taxableLeak: "no",
      }),
      "risky",
      ["growth-without-tsumitate"],
    );
  });

  it("marks planning-only as the only finding", () => {
    expectDiagnosis(
      fill({
        account: "planning",
        quotaUse: "unknown",
        frameUse: "none",
        idleCash: "none",
        taxableLeak: "unknown",
      }),
      "risky",
      ["planning-only"],
    );
  });

  it("does not fire idle-cash-lots when the account is opened and quota is mostly used", () => {
    const result = diagnose(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "tsumitate",
        idleCash: "lots",
        taxableLeak: "no",
      }),
    );
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe("今年の枠、ちゃんと座れてます");
  });

  it("does not claim leftover quota when usage is unknown and buying outside NISA", () => {
    const result = diagnose(
      fill({
        account: "opened",
        quotaUse: "unknown",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "yes",
      }),
    );
    const finding = result.findings.find(
      (item) => item.id === "taxable-while-quota-left",
    );
    expect(result.findings.map((item) => item.id)).toEqual([
      "unknown-quota",
      "taxable-while-quota-left",
    ]);
    expect(finding?.title).toBe("別の口座でも、買っています");
  });

  it("treats unknown quota as possibly left, not as mostly used", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "unknown",
        frameUse: "both",
        idleCash: "lots",
        taxableLeak: "yes",
      }),
      "loss",
      ["unknown-quota", "idle-cash-lots", "taxable-while-quota-left"],
    );
  });

  it("marks unknown quota alone as risky, not ok", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "unknown",
        frameUse: "tsumitate",
        idleCash: "none",
        taxableLeak: "no",
      }),
      "risky",
      ["unknown-quota"],
    );
  });

  it("adds a paused tsumitate setting beside a partial quota", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        recurring: "paused",
      }),
      "risky",
      ["partial-quota", "recurring-paused"],
    );
  });

  it("adds a missing tsumitate setting when the quota is unused", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "none",
        frameUse: "tsumitate",
        idleCash: "none",
        taxableLeak: "no",
        recurring: "never",
      }),
      "loss",
      ["unused-quota", "recurring-never"],
    );
  });

  it("adds an unknown tsumitate setting beside an unknown quota", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "unknown",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        recurring: "unknown",
      }),
      "risky",
      ["unknown-quota", "recurring-unknown"],
    );
  });

  it("adds a small uninvested broker balance beside a partial quota", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        brokerCash: "some",
      }),
      "risky",
      ["partial-quota", "broker-cash-some"],
    );
  });

  it("does not nag about tsumitate settings when the quota is mostly used", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        recurring: "paused",
      }),
      "ok",
      [],
    );
  });

  it("marks selling and stopping as its own loss", () => {
    const answers = fill({
      account: "opened",
      quotaUse: "most",
      frameUse: "both",
      idleCash: "none",
      taxableLeak: "no",
      soldThisYear: "stopped",
    });
    expectDiagnosis(answers, "loss", ["sold-and-stopped"]);
    expect(diagnose(answers).headline).toBe("非課税の席、空席の気配です");
  });

  it("does not treat an unknown sale as a finding", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        soldThisYear: "unknown",
      }),
      "ok",
      [],
    );
  });

  it("marks a large uninvested broker balance as loss while quota remains", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        brokerCash: "lots",
      }),
      "loss",
      ["partial-quota", "broker-cash-lots"],
    );
  });

  it("does not flag broker cash when this year's quota is mostly used", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        brokerCash: "lots",
      }),
      "ok",
      [],
    );
  });

  it("marks buying at another broker as loss while quota remains", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        sameBroker: "other",
      }),
      "loss",
      ["partial-quota", "other-broker"],
    );
  });

  it("does not flag another broker when this year's quota is mostly used", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        sameBroker: "other",
      }),
      "ok",
      [],
    );
  });

  it("does not add other-broker when there is no NISA account", () => {
    expectDiagnosis(
      fill({
        account: "none",
        quotaUse: "unknown",
        frameUse: "none",
        idleCash: "none",
        taxableLeak: "unknown",
        sameBroker: "other",
      }),
      "loss",
      ["no-account"],
    );
  });

  it("marks a non-proportional dividend route as loss", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        dividendRoute: "other",
      }),
      "loss",
      ["dividend-taxed"],
    );
  });

  it("does not flag an unknown dividend route", () => {
    expectDiagnosis(
      fill({
        account: "opened",
        quotaUse: "most",
        frameUse: "growth",
        idleCash: "none",
        taxableLeak: "no",
        dividendRoute: "unknown",
      }),
      "risky",
      ["growth-without-tsumitate"],
    );
  });
});
