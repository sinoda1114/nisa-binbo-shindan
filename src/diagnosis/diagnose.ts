import { RULES } from "./rules";
import type { Answers, Diagnosis, Finding, Verdict } from "./types";

export const VERDICT_COPY: Record<Verdict, { headline: string; summary: string }> = {
  loss: {
    headline: "今年の非課税枠を取りこぼしています",
    summary:
      "使い方のどこかで、今年の非課税枠を活かせていません。金額は出していません。枠が残っているなら、今年中に使うものです。",
  },
  risky: {
    headline: "NISAの使い方に確認したい点があります",
    summary:
      "以下の項目を確認し、今年中に対応するか検討してください。",
  },
  ok: {
    headline: "今年のNISA枠をおおむね活用できています",
    summary:
      "大きな未使用や、NISA以外の口座へのずれは見当たりませんでした。未使用の年間枠は翌年に繰り越せません。来年も、その年のうちに使ってください。",
  },
};

function reduceVerdict(findings: Finding[]): Verdict {
  if (findings.some((finding) => finding.severity === "loss")) {
    return "loss";
  }
  if (findings.some((finding) => finding.severity === "risk")) {
    return "risky";
  }
  return "ok";
}

export function diagnose(answers: Answers): Diagnosis {
  const findings: Finding[] = RULES.filter((rule) => rule.when(answers)).map(
    (rule) => ({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      detail: rule.detail,
    }),
  );
  const verdict = reduceVerdict(findings);
  const copy = VERDICT_COPY[verdict];
  return {
    verdict,
    headline: copy.headline,
    summary: copy.summary,
    findings,
  };
}
