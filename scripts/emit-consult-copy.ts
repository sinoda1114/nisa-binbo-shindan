import { writeFileSync } from "node:fs";
import { CONSULT_LIMIT, VERDICT_LABEL } from "../src/consult";
import { VERDICT_COPY } from "../src/diagnosis/diagnose";
import { RULES } from "../src/diagnosis/rules";
import type { Verdict } from "../src/diagnosis/types";

const verdicts = Object.fromEntries(
  (Object.keys(VERDICT_COPY) as Verdict[]).map((verdict) => [
    verdict,
    {
      label: VERDICT_LABEL[verdict],
      headline: VERDICT_COPY[verdict].headline,
      summary: VERDICT_COPY[verdict].summary,
    },
  ]),
);

const findings = RULES.map((rule) => `${rule.title}\n${rule.detail}`);

const source = `// 画面に出る診断文。scripts/emit-consult-copy.ts が src から書く。
// Vercel は api/*.ts だけを JavaScript にする。../src は関数の中で解決できない。
export const consultLimit = ${JSON.stringify(CONSULT_LIMIT)};
export const verdicts = ${JSON.stringify(verdicts, null, 2)};
export const findings = ${JSON.stringify(findings, null, 2)};
`;

writeFileSync(new URL("../server/screen-copy.js", import.meta.url), source);
