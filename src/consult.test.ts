import { describe, expect, it } from "vitest";
import { CONSULT_COPY, consultResult } from "./consult";

describe("consultResult", () => {
  it("sends the on-screen wording and drops finding ids", () => {
    const diagnosis = {
      verdict: "loss" as const,
      headline: "今年の非課税枠を取りこぼしています",
      summary: "使い方のどこかで、今年の非課税枠を活かせていません。",
      findings: [
        {
          id: "quota-deferred" as const,
          severity: "loss" as const,
          title: "今年の枠を、来年に回す予定です",
          detail: "今年の非課税枠は、来年に繰り越せません。",
        },
      ],
    };
    const sent = consultResult(diagnosis);

    expect(sent).toEqual({
      verdictLabel: "損している",
      headline: "今年の非課税枠を取りこぼしています",
      summary: "使い方のどこかで、今年の非課税枠を活かせていません。",
      findings: [
        {
          title: "今年の枠を、来年に回す予定です",
          detail: "今年の非課税枠は、来年に繰り越せません。",
        },
      ],
    });
    expect(JSON.stringify(sent)).not.toContain("quota-deferred");
    expect(sent).not.toHaveProperty("answers");
  });

  it("uses the consult label and the unconfigured sentence", () => {
    expect(CONSULT_COPY.fab).toBe("AIに相談");
    expect(CONSULT_COPY.unconfigured).toBe("相談の準備ができていません");
    expect(CONSULT_COPY.note).toContain("投資助言ではありません");
    expect(CONSULT_COPY.note).toContain("銘柄の推奨や税額の計算はしません");
  });
});

