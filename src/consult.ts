import type { Diagnosis, Verdict } from "./diagnosis/types";

export const VERDICT_LABEL: Record<Verdict, string> = {
  loss: "損している",
  risky: "危うい",
  ok: "概ね良い",
};

export const CONSULT_COPY = {
  fab: "AIに相談",
  title: "AIに相談",
  close: "閉じる",
  unconfigured: "相談の準備ができていません",
  opening: "診断結果を読んでいます",
  sending: "送っています",
  failed: "相談を続けられませんでした。閉じて、もう一度開いてください。",
  send: "送る",
  placeholder: "結果の使い方で確認したいこと",
  note: "この相談は、出た結果の言い換えと、使い方の確認です。投資助言ではありません。銘柄の推奨や税額の計算はしません。",
} as const;

export type ConsultFinding = {
  title: string;
  detail: string;
};

export type ConsultResult = {
  verdictLabel: string;
  headline: string;
  summary: string;
  findings: ConsultFinding[];
};

export type ConsultMessage = {
  role: "user" | "model";
  text: string;
};

export type ConsultReply =
  | { ok: true; text: string }
  | { ok: false; reason: "unconfigured" | "unavailable" };

export const CONSULT_LIMIT = {
  user: 600,
  model: 2_000,
  messages: 20,
} as const;

export function consultResult(diagnosis: Diagnosis): ConsultResult {
  return {
    verdictLabel: VERDICT_LABEL[diagnosis.verdict],
    headline: diagnosis.headline,
    summary: diagnosis.summary,
    findings: diagnosis.findings.map((finding) => ({
      title: finding.title,
      detail: finding.detail,
    })),
  };
}

export function readConsultReply(payload: unknown): ConsultReply {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, reason: "unavailable" };
  }
  if (
    "ok" in payload &&
    payload.ok === true &&
    "text" in payload &&
    typeof payload.text === "string" &&
    payload.text.trim().length > 0
  ) {
    return { ok: true, text: payload.text.trim() };
  }
  if ("reason" in payload && payload.reason === "unconfigured") {
    return { ok: false, reason: "unconfigured" };
  }
  return { ok: false, reason: "unavailable" };
}
