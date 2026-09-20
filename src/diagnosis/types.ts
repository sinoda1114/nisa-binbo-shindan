export type AccountStatus = "opened" | "planning" | "none";
export type QuotaUse = "none" | "some" | "most" | "unknown";
export type FrameUse = "tsumitate" | "growth" | "both" | "unsure" | "none";
export type IdleCash = "lots" | "some" | "none" | "unknown";
export type TaxableLeak = "yes" | "no" | "unknown";

export type Answers = {
  account: AccountStatus;
  quotaUse: QuotaUse;
  frameUse: FrameUse;
  idleCash: IdleCash;
  taxableLeak: TaxableLeak;
};

export type FindingId =
  | "no-account"
  | "planning-only"
  | "unused-quota"
  | "partial-quota"
  | "unknown-quota"
  | "idle-cash-lots"
  | "idle-cash-some"
  | "taxable-while-quota-left"
  | "frame-unsure"
  | "growth-without-tsumitate"
  | "opened-but-not-buying";

export type FindingSeverity = "loss" | "risk";

export type Finding = {
  id: FindingId;
  severity: FindingSeverity;
  title: string;
  detail: string;
};

export type Verdict = "loss" | "risky" | "ok";

export type Diagnosis = {
  verdict: Verdict;
  headline: string;
  summary: string;
  findings: Finding[];
};

export type Rule = {
  id: FindingId;
  severity: FindingSeverity;
  when: (answers: Answers) => boolean;
  title: string;
  detail: string;
};
