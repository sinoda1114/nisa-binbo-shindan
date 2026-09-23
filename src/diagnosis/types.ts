export type AccountStatus = "opened" | "planning" | "none";
export type QuotaUse = "none" | "some" | "most" | "unknown";
export type FrameUse = "tsumitate" | "growth" | "both" | "unsure" | "none";
export type IdleCash = "lots" | "some" | "none" | "unknown";
export type TaxableLeak = "yes" | "no" | "unknown";
export type Recurring = "running" | "paused" | "never" | "unknown";
export type SoldThisYear = "stopped" | "still-using" | "not-sold" | "unknown";
export type BrokerCash = "lots" | "some" | "none" | "unknown";
export type SameBroker = "same" | "other" | "not-buying" | "unknown";
export type DividendRoute = "proportional" | "other" | "none" | "unknown";

export type Answers = {
  account: AccountStatus;
  quotaUse: QuotaUse;
  frameUse: FrameUse;
  recurring: Recurring;
  soldThisYear: SoldThisYear;
  idleCash: IdleCash;
  brokerCash: BrokerCash;
  taxableLeak: TaxableLeak;
  sameBroker: SameBroker;
  dividendRoute: DividendRoute;
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
  | "opened-but-not-buying"
  | "recurring-paused"
  | "recurring-never"
  | "recurring-unknown"
  | "sold-and-stopped"
  | "broker-cash-lots"
  | "broker-cash-some"
  | "other-broker"
  | "dividend-taxed";

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
