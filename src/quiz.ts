import type {
  Answers,
  BrokerCash,
  DividendRoute,
  FrameUse,
  GrowthQuota,
  IdleCash,
  QuotaUse,
  Recurring,
  SameBroker,
  SoldThisYear,
  TaxableLeak,
  TsumitateAmount,
} from "./diagnosis/types";

type Choice<Value extends string> = {
  value: Value;
  label: string;
};

export type Question =
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
      field: "tsumitateAmount";
      prompt: string;
      choices: Choice<TsumitateAmount>[];
    }
  | {
      field: "growthQuota";
      prompt: string;
      choices: Choice<GrowthQuota>[];
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
    field: "tsumitateAmount",
    prompt: "つみたて投資枠の定期買付は、月いくらくらいですか。",
    choices: [
      { value: "symbolic", label: "月数千円以下" },
      { value: "moderate", label: "月1万円前後" },
      { value: "filling", label: "年120万円に近い" },
      { value: "none", label: "つみたてはしていない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "growthQuota",
    prompt: "成長投資枠（年240万円）は、今年どのくらい使っていますか。",
    choices: [
      { value: "none", label: "ほとんど使っていない" },
      { value: "some", label: "一部だけ" },
      { value: "most", label: "ほぼ使い切っている" },
      { value: "unknown", label: "わからない" },
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
    prompt: "投資に使う予定で、預金口座に残しているお金はありますか。",
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
    prompt: "今年のNISA口座がある証券会社以外でも、投資商品を買っていますか。",
    choices: [
      { value: "same", label: "NISA口座がある会社だけで買っている" },
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
      { value: "none", label: "NISA口座に配当のある上場株式は保有していない" },
      { value: "unknown", label: "わからない" },
    ],
  },
];

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return (
    answers.quotaUse !== undefined &&
    answers.frameUse !== undefined &&
    answers.tsumitateAmount !== undefined &&
    answers.growthQuota !== undefined &&
    answers.recurring !== undefined &&
    answers.soldThisYear !== undefined &&
    answers.idleCash !== undefined &&
    answers.brokerCash !== undefined &&
    answers.taxableLeak !== undefined &&
    answers.sameBroker !== undefined &&
    answers.dividendRoute !== undefined
  );
}
