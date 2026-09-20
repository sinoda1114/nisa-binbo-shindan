import type {
  AccountStatus,
  Answers,
  FrameUse,
  IdleCash,
  QuotaUse,
  TaxableLeak,
} from "./diagnosis/types";

type Choice<Value extends string> = {
  value: Value;
  label: string;
};

export type Question =
  | {
      field: "account";
      prompt: string;
      choices: Choice<AccountStatus>[];
    }
  | {
      field: "quotaUse";
      prompt: string;
      choices: Choice<QuotaUse>[];
    }
  | {
      field: "frameUse";
      prompt: string;
      choices: Choice<FrameUse>[];
    }
  | {
      field: "idleCash";
      prompt: string;
      choices: Choice<IdleCash>[];
    }
  | {
      field: "taxableLeak";
      prompt: string;
      choices: Choice<TaxableLeak>[];
    };

export const QUESTIONS: Question[] = [
  {
    field: "account",
    prompt: "NISA口座は開設していますか。",
    choices: [
      { value: "opened", label: "開設している" },
      { value: "planning", label: "これから開設する" },
      { value: "none", label: "開設していない" },
    ],
  },
  {
    field: "quotaUse",
    prompt: "今年の年間投資枠はどれくらい使っていますか。",
    choices: [
      { value: "none", label: "ほとんど使っていない" },
      { value: "some", label: "半分くらい" },
      { value: "most", label: "ほぼ使い切っている" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "frameUse",
    prompt: "つみたて投資枠と成長投資枠は、どちらを使っていますか。",
    choices: [
      { value: "tsumitate", label: "つみたて投資枠が中心" },
      { value: "growth", label: "成長投資枠が中心" },
      { value: "both", label: "両方使っている" },
      { value: "unsure", label: "枠の違いはよくわからない" },
      { value: "none", label: "まだ買っていない" },
    ],
  },
  {
    field: "idleCash",
    prompt: "投資するつもりで、預金のまま置いているお金はありますか。",
    choices: [
      { value: "lots", label: "かなりある" },
      { value: "some", label: "少しある" },
      { value: "none", label: "ほとんどない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "taxableLeak",
    prompt: "NISAの枠が残っているのに、課税口座で投資していますか。",
    choices: [
      { value: "yes", label: "課税口座でも買っている" },
      { value: "no", label: "課税口座では買っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
];

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return (
    answers.account !== undefined &&
    answers.quotaUse !== undefined &&
    answers.frameUse !== undefined &&
    answers.idleCash !== undefined &&
    answers.taxableLeak !== undefined
  );
}
