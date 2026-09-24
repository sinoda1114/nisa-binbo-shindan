import type {
  AccountStatus,
  Answers,
  BrokerCash,
  DividendRoute,
  FrameUse,
  IdleCash,
  QuotaUse,
  Recurring,
  SameBroker,
  SoldThisYear,
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
      field: "recurring";
      prompt: string;
      choices: Choice<Recurring>[];
    }
  | {
      field: "soldThisYear";
      prompt: string;
      choices: Choice<SoldThisYear>[];
    }
  | {
      field: "idleCash";
      prompt: string;
      choices: Choice<IdleCash>[];
    }
  | {
      field: "brokerCash";
      prompt: string;
      choices: Choice<BrokerCash>[];
    }
  | {
      field: "taxableLeak";
      prompt: string;
      choices: Choice<TaxableLeak>[];
    }
  | {
      field: "sameBroker";
      prompt: string;
      choices: Choice<SameBroker>[];
    }
  | {
      field: "dividendRoute";
      prompt: string;
      choices: Choice<DividendRoute>[];
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
    field: "recurring",
    prompt: "つみたて（定期的な買付）の設定は、今動いていますか。",
    choices: [
      { value: "running", label: "動いている" },
      { value: "paused", label: "止めてある" },
      { value: "never", label: "設定したことがない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "soldThisYear",
    prompt: "今年、NISAで売ったあとはどうしていますか。",
    choices: [
      { value: "stopped", label: "売って、その分は今年もう買わない" },
      { value: "still-using", label: "売っても、残りの枠は使う" },
      { value: "not-sold", label: "今年は売っていない" },
      { value: "unknown", label: "わからない" },
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
    field: "brokerCash",
    prompt: "証券会社に入れたまま、まだ買っていないお金はありますか。",
    choices: [
      { value: "lots", label: "かなりある" },
      { value: "some", label: "少しある" },
      { value: "none", label: "ほとんどない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "taxableLeak",
    prompt:
      "NISAの枠が残っているのに、NISAではない口座（特定口座や一般口座）で投資していますか。",
    choices: [
      { value: "yes", label: "NISAではない口座でも買っている" },
      { value: "no", label: "NISAではない口座では買っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "sameBroker",
    prompt: "買っている証券会社は、今年のNISAを開設している会社と同じですか。",
    choices: [
      { value: "same", label: "同じ会社で買っている" },
      { value: "other", label: "別の会社でも買っている" },
      { value: "not-buying", label: "まだ買っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "dividendRoute",
    prompt: "NISAで持っている上場株式の配当金は、どの方式で受け取っていますか。",
    choices: [
      { value: "proportional", label: "株式数比例配分方式" },
      { value: "other", label: "それ以外の方式" },
      { value: "none", label: "配当のある株は持っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
];

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return (
    answers.account !== undefined &&
    answers.quotaUse !== undefined &&
    answers.frameUse !== undefined &&
    answers.recurring !== undefined &&
    answers.soldThisYear !== undefined &&
    answers.idleCash !== undefined &&
    answers.brokerCash !== undefined &&
    answers.taxableLeak !== undefined &&
    answers.sameBroker !== undefined &&
    answers.dividendRoute !== undefined
  );
}
