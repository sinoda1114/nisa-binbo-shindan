import type { Diagnosis, Finding } from "./types";

const SCALE = 5;
const FILLED_STAR = "★";
const EMPTY_STAR = "☆";

export type UtilizationLevel = 1 | 2 | 3 | 4 | 5;

function countSeverity(
  findings: readonly Finding[],
  severity: Finding["severity"],
): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

export function utilizationLevel(
  diagnosis: Pick<Diagnosis, "verdict" | "findings">,
): UtilizationLevel {
  switch (diagnosis.verdict) {
    case "ok":
      return 5;
    case "risky":
      return countSeverity(diagnosis.findings, "risk") >= 2 ? 3 : 4;
    case "loss":
      return countSeverity(diagnosis.findings, "loss") >= 2 ? 1 : 2;
    default: {
      const unreachable: never = diagnosis.verdict;
      return unreachable;
    }
  }
}

export function utilizationMarks(level: UtilizationLevel): string {
  return FILLED_STAR.repeat(level) + EMPTY_STAR.repeat(SCALE - level);
}
