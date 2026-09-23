import { RULES } from "./rules";
import type { Answers, Diagnosis, Finding, Verdict } from "./types";

const COPY: Record<Verdict, { headline: string; summary: string }> = {
  gap: {
    headline: "制度の理解に、誤解が残っている可能性があります",
    summary:
      "今回の回答には、公開されている制度の整理とずれる説明がありました。金額や税額は計算していません。何を買うべきかは述べません。下記の所見を確認してほしい点です。",
  },
  shaky: {
    headline: "確認した方がよい点が残っています",
    summary:
      "わからない、と答えた項目があります。断定はしません。下記の所見を、公式の案内で確認してほしい点です。",
  },
  solid: {
    headline: "今回の範囲では、大きな誤解は見当たりません",
    summary:
      "今回の質問の範囲では、選んだ説明は公開資料の整理とずれていませんでした。質問の外のことや、生年月日・契約による例外は見ていません。必要な案内を確認してほしい点です。",
  },
};

function reduceVerdict(findings: Finding[]): Verdict {
  if (findings.some((finding) => finding.severity === "gap")) {
    return "gap";
  }
  if (findings.some((finding) => finding.severity === "shaky")) {
    return "shaky";
  }
  return "solid";
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
