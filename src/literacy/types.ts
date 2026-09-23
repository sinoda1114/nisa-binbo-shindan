export type PurchasingPower = "real-can-fall" | "nominal-only" | "unknown";
export type Compound = "on-interest" | "principal-only" | "unknown";
export type DepositCover = "capped-yen" | "everything" | "unknown";
export type AccountFiling = "withholding-optional" | "always-same" | "unknown";
export type ReturnOfCapital = "reduces-basis" | "extra-profit" | "unknown";
export type NisaHolding = "unlimited" | "still-capped" | "unknown";
export type PensionDeferral = "rises-monthly" | "flat" | "unknown";
export type Tsumitate = "not-guaranteed" | "always-up" | "unknown";
export type TrustFee = "ongoing" | "purchase-only" | "unknown";

export type Answers = {
  purchasingPower: PurchasingPower;
  compound: Compound;
  depositCover: DepositCover;
  accountFiling: AccountFiling;
  returnOfCapital: ReturnOfCapital;
  nisaHolding: NisaHolding;
  pensionDeferral: PensionDeferral;
  tsumitate: Tsumitate;
  trustFee: TrustFee;
};

export type FindingId =
  | "purchasing-power-wrong"
  | "purchasing-power-unknown"
  | "compound-wrong"
  | "compound-unknown"
  | "deposit-cover-wrong"
  | "deposit-cover-unknown"
  | "account-filing-wrong"
  | "account-filing-unknown"
  | "return-of-capital-wrong"
  | "return-of-capital-unknown"
  | "nisa-holding-wrong"
  | "nisa-holding-unknown"
  | "pension-deferral-wrong"
  | "pension-deferral-unknown"
  | "tsumitate-wrong"
  | "tsumitate-unknown"
  | "trust-fee-wrong"
  | "trust-fee-unknown";

export type FindingSeverity = "gap" | "shaky";

export type Finding = {
  id: FindingId;
  severity: FindingSeverity;
  title: string;
  detail: string;
};

export type Verdict = "gap" | "shaky" | "solid";

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
