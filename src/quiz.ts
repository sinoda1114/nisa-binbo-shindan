import type {
  Answers,
  BrokerCash,
  DividendRoute,
  FrameUse,
  IdleCash,
  QuotaPlan,
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
      field: "quotaPlan";
      prompt: string;
      choices: Choice<QuotaPlan>[];
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
    field: "quotaPlan",
    prompt: "今年のNISA枠は、年内に使う予定ですか。",
    choices: [
      { value: "use", label: "今年中に使う" },
      { value: "defer", label: "来年に回す" },
      { value: "undecided", label: "まだ決めていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "quotaUse",
    prompt: "今年のNISAの年間投資枠を、どのくらい使っていますか。",
    choices: [
      { value: "none", label: "ほとんど使っていない" },
      { value: "some", label: "半分くらい" },
      { value: "most", label: "ほぼ使い切っている" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "frameUse",
    prompt: "つみたて投資枠と成長投資枠を、どのように使っていますか。",
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
    prompt: "定期買付（積立）の設定は、現在有効ですか。",
    choices: [
      { value: "running", label: "有効になっている" },
      { value: "paused", label: "停止している" },
      { value: "never", label: "設定したことがない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "soldThisYear",
    prompt: "今年、NISAで売るつもりはありますか。",
    choices: [
      { value: "stopped", label: "売る。今年はもう買わない" },
      { value: "still-using", label: "売る。残りの枠は使う" },
      { value: "not-sold", label: "売らない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "idleCash",
    prompt: "預金口座に残しているお金はありますか。",
    choices: [
      { value: "lots", label: "かなりある" },
      { value: "some", label: "少しある" },
      { value: "none", label: "ほとんどない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "brokerCash",
    prompt: "証券口座に入金したものの、まだ買付に使っていない現金はありますか。",
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
      "今年のNISAの枠が残っている状態で、特定口座や一般口座で投資商品を買っていますか。",
    choices: [
      { value: "yes", label: "NISAではない口座でも買っている" },
      { value: "no", label: "NISAではない口座では買っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "sameBroker",
    prompt: "NISA口座とは別の証券会社でも、買っていますか。",
    choices: [
      { value: "same", label: "別の会社では買っていない" },
      { value: "other", label: "別の会社でも買っている" },
      { value: "not-buying", label: "まだ買っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "dividendRoute",
    prompt: "NISAで持っている株の配当金は、どこで受け取っていますか。",
    choices: [
      { value: "proportional", label: "証券会社の口座（株式数比例配分方式）" },
      { value: "other", label: "銀行やゆうちょの口座" },
      { value: "none", label: "配当金が出る株は持っていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
];

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return (
    answers.quotaPlan !== undefined &&
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
