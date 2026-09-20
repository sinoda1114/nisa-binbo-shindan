import { RULES } from "./rules";
import type { Answers, Diagnosis, Finding, Verdict } from "./types";

const COPY: Record<Verdict, { headline: string; summary: string }> = {
  loss: {
    headline: "非課税の恩恵を取りこぼしている可能性があります",
    summary:
      "回答から、NISAの使い方として非課税の恩恵を取りこぼしている可能性があります。金額や税額は計算していません。下記の所見を確認してほしい点です。",
  },
  risky: {
    headline: "取りこぼしにつながる使い方の可能性があります",
    summary:
      "今回の回答では、枠の使い方や置き場所を確認した方がよさそうです。断定はしません。下記の所見を確認してほしい点です。",
  },
  ok: {
    headline: "使い方として大きな取りこぼしは見当たりません",
    summary:
      "今回の回答の範囲では、年間枠の大きな未使用や、課税口座へのずれは見当たりませんでした。つみたて投資枠は年120万円、成長投資枠は年240万円、合計は年360万円です。未使用の年間枠は翌年に繰り越せません。生涯の非課税保有限度額は1800万円で、うち成長投資枠は1200万円までです。",
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
