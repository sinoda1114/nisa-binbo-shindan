import { RULES } from "./rules";
import type { Answers, Diagnosis, Finding, Verdict } from "./types";

const COPY: Record<Verdict, { headline: string; summary: string }> = {
  loss: {
    headline: "非課税の席、空席の気配です",
    summary:
      "どこかで席を空けている気配です。金額は出していません。空いているなら、今年中に使うものです。",
  },
  risky: {
    headline: "使い方、あと一歩で惜しいです",
    summary:
      "大きな損というより、使い方の端が気になります。断定はしません。下記を見て、今年中に手を打つか決めてください。",
  },
  ok: {
    headline: "今年の枠、ちゃんと座れてます",
    summary:
      "大きな未使用や、NISA以外の口座へのずれは見当たりませんでした。未使用の年間枠は翌年に繰り越せません。来年も、空く前に使ってください。",
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
  const copy = COPY[verdict];
  return {
    verdict,
    headline: copy.headline,
    summary: copy.summary,
    findings,
  };
}
