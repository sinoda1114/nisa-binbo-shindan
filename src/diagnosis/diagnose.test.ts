import { describe, expect, it } from "vitest";
import { VERDICT_COPY, diagnose } from "./diagnose";
import { RULES } from "./rules";
import type { Answers, FindingId, Verdict } from "./types";

const NEUTRAL = {
  tsumitateAmount: "moderate",
  growthQuota: "most",
  recurring: "running",
  soldThisYear: "not-sold",
  brokerCash: "none",
  sameBroker: "same",
  dividendRoute: "none",
} as const satisfies Pick<
  Answers,
  | "tsumitateAmount"
  | "growthQuota"
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
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
      }),
    );
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe("今年のNISA枠をおおむね活用できています");
  });

  it("marks a symbolic tsumitate amount as risk while this year's quota remains", () => {
    const answers = fill({
      quotaUse: "some",
      frameUse: "both",
      idleCash: "none",
      taxableLeak: "no",
      tsumitateAmount: "symbolic",
    });
    expectDiagnosis(answers, "risky", ["partial-quota", "tsumitate-small"]);
    const finding = diagnose(answers).findings.find(
      (item) => item.id === "tsumitate-small",
    );
    expect(finding?.detail).toBe(
      "積立額が小さく、つみたて投資枠の年120万円に届いていません。未使用分は翌年に繰り越せません。何を積むかは述べません。",
    );
    expect(finding?.detail).not.toMatch(/おすすめ|銘柄は/);
  });

  it("stacks unused quota, idle cash, taxable leak, and unsure frames as loss", () => {
    expectDiagnosis(
      fill({
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
      quotaUse: "some",
      frameUse: "tsumitate",
      idleCash: "some",
      taxableLeak: "no",
    });
    expectDiagnosis(answers, "risky", ["partial-quota", "idle-cash-some"]);
    expect(diagnose(answers).headline).toBe("NISAの使い方に確認したい点があります");
    expect(idsOf(answers)).not.toContain("unused-quota");
  });

  it("marks growth-centered use as the only finding when quota is mostly used", () => {
    expectDiagnosis(
      fill({
        quotaUse: "most",
        frameUse: "growth",
        idleCash: "none",
        taxableLeak: "no",
      }),
      "risky",
      ["growth-without-tsumitate"],
    );
  });

  it("does not flag growth-centered use when tsumitate filling reaches the annual frame", () => {
    expectDiagnosis(
      fill({
        quotaUse: "most",
        frameUse: "growth",
        idleCash: "none",
        taxableLeak: "no",
        tsumitateAmount: "filling",
        growthQuota: "most",
      }),
      "ok",
      [],
    );
  });

  it("does not mark a symbolic tsumitate amount when this year's quota is mostly used", () => {
    expectDiagnosis(
      fill({
        quotaUse: "most",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        tsumitateAmount: "symbolic",
      }),
      "ok",
      [],
    );
  });

  it("marks leftover growth quota when the annual quota is not almost unused", () => {
    const answers = fill({
      quotaUse: "most",
      frameUse: "both",
      idleCash: "none",
      taxableLeak: "no",
      growthQuota: "some",
    });
    expectDiagnosis(answers, "risky", ["growth-quota-left"]);
    const finding = diagnose(answers).findings.find(
      (item) => item.id === "growth-quota-left",
    );
    expect(finding?.detail).toBe(
      "成長投資枠が残っています。未使用分は翌年に繰り越せません。銘柄は勧めません。",
    );
  });

  it("leaves an almost unused annual quota to unused-quota", () => {
    expectDiagnosis(
      fill({
        quotaUse: "none",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        tsumitateAmount: "symbolic",
        growthQuota: "none",
      }),
      "loss",
      ["unused-quota", "tsumitate-small"],
    );
  });

  it("still flags frames that have not bought yet", () => {
    expectDiagnosis(
      fill({
        quotaUse: "unknown",
        frameUse: "none",
        idleCash: "none",
        taxableLeak: "unknown",
      }),
      "risky",
      ["unknown-quota", "not-yet-buying"],
    );
  });

  it("does not fire idle-cash-lots when this year's quota is mostly used", () => {
    const result = diagnose(
      fill({
        quotaUse: "most",
        frameUse: "tsumitate",
        idleCash: "lots",
        taxableLeak: "no",
      }),
    );
    expect(result.verdict).toBe("ok");
    expect(result.findings.map((finding) => finding.id)).toEqual([]);
    expect(result.headline).toBe("今年のNISA枠をおおむね活用できています");
  });

  it("does not claim leftover quota when usage is unknown and buying outside NISA", () => {
    const result = diagnose(
      fill({
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
    expect(finding?.title).toBe("NISA以外の口座でも買付しています");
  });

  it("treats unknown quota as possibly left, not as mostly used", () => {
    expectDiagnosis(
      fill({
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
      quotaUse: "most",
      frameUse: "both",
      idleCash: "none",
      taxableLeak: "no",
      soldThisYear: "stopped",
    });
    expectDiagnosis(answers, "loss", ["sold-and-stopped"]);
    expect(diagnose(answers).headline).toBe("今年の非課税枠を取りこぼしています");
  });

  it("does not treat an unknown sale as a finding", () => {
    expectDiagnosis(
      fill({
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

  it("marks an unused growth quota beside a partial annual quota", () => {
    expectDiagnosis(
      fill({
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        growthQuota: "none",
      }),
      "risky",
      ["partial-quota", "growth-quota-left"],
    );
  });

  it("does not flag an unknown growth quota", () => {
    expectDiagnosis(
      fill({
        quotaUse: "some",
        frameUse: "both",
        idleCash: "none",
        taxableLeak: "no",
        growthQuota: "unknown",
      }),
      "risky",
      ["partial-quota"],
    );
  });

  it("marks a non-proportional dividend route as loss", () => {
    expectDiagnosis(
      fill({
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

  it("does not use the seat metaphor in headlines, findings, or advice", () => {
    const text = [
      ...Object.values(VERDICT_COPY).flatMap((copy) => [copy.headline, copy.summary]),
      ...RULES.flatMap((rule) => [rule.title, rule.detail]),
    ].join("\n");
    expect(text).not.toMatch(/席|座れ|座って/);
  });

  it("does not flag an unknown dividend route", () => {
    expectDiagnosis(
      fill({
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
