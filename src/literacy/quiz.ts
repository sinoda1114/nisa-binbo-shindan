import type {
  AccountFiling,
  Answers,
  Compound,
  DepositCover,
  NisaHolding,
  PensionDeferral,
  PurchasingPower,
  ReturnOfCapital,
  TrustFee,
  Tsumitate,
} from "./types";

type Choice<Value extends string> = {
  value: Value;
  label: string;
};

export const PROVISIONAL_TITLE = "金融リテラシー診断（仮）";

export const TITLE_NOTE = "タイトルは仮のものです。";

export type Question =
  | {
      field: "purchasingPower";
      prompt: string;
      choices: Choice<PurchasingPower>[];
    }
  | {
      field: "compound";
      prompt: string;
      choices: Choice<Compound>[];
    }
  | {
      field: "depositCover";
      prompt: string;
      choices: Choice<DepositCover>[];
    }
  | {
      field: "accountFiling";
      prompt: string;
      choices: Choice<AccountFiling>[];
    }
  | {
      field: "returnOfCapital";
      prompt: string;
      choices: Choice<ReturnOfCapital>[];
    }
  | {
      field: "nisaHolding";
      prompt: string;
      choices: Choice<NisaHolding>[];
    }
  | {
      field: "pensionDeferral";
      prompt: string;
      choices: Choice<PensionDeferral>[];
    }
  | {
      field: "tsumitate";
      prompt: string;
      choices: Choice<Tsumitate>[];
    }
  | {
      field: "trustFee";
      prompt: string;
      choices: Choice<TrustFee>[];
    };

export const QUESTIONS: Question[] = [
  {
    field: "purchasingPower",
    prompt: "物価が上がったとき、預金の数字が同じなら、買える量はどうなりますか。",
    choices: [
      { value: "real-can-fall", label: "減ることがある" },
      { value: "nominal-only", label: "数字が同じなら、買える量も同じ" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "compound",
    prompt: "複利とは、どの説明に近いですか。",
    choices: [
      { value: "on-interest", label: "すでについた利息にも、次の利息がつく" },
      { value: "principal-only", label: "利息はいつも、最初の元本だけにつく" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "depositCover",
    prompt:
      "銀行が破綻したとき、預金保険が守る範囲はどれですか。",
    choices: [
      {
        value: "capped-yen",
        label:
          "利息のつく円預金等は、1金融機関ごとに元本1,000万円までと利息等が対象。投資信託と外貨預金は対象外",
      },
      {
        value: "everything",
        label: "銀行で買った投資信託や外貨預金も含め、全額守られる",
      },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "accountFiling",
    prompt:
      "上場株式等の手続きで、特定口座（源泉徴収あり）と一般口座はどう違いますか。",
    choices: [
      {
        value: "withholding-optional",
        label:
          "源泉徴収ありは原則として申告不要にできる。一般口座は自分で計算して申告する",
      },
      {
        value: "always-same",
        label: "どちらの口座でも、必ず自分で同じ申告をする",
      },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "returnOfCapital",
    prompt: "投資信託の元本払戻金（特別分配金）は、何ですか。",
    choices: [
      {
        value: "reduces-basis",
        label: "元本の払い戻しで、その分だけ個別元本が減る。利益そのものではない",
      },
      { value: "extra-profit", label: "いつも利益の分配で、元本は減らない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "nisaHolding",
    prompt: "2024年からのNISAで、非課税のまま保有できる期間はどれですか。",
    choices: [
      { value: "unlimited", label: "無期限" },
      { value: "still-capped", label: "今も最長5年、または20年で終わる" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "pensionDeferral",
    prompt:
      "老齢基礎年金・老齢厚生年金を、65歳より遅らせて受け取り始めると、月額はどうなりますか。",
    choices: [
      {
        value: "rises-monthly",
        label: "1か月あたり0.7%増える。上限は原則75歳",
      },
      { value: "flat", label: "遅らせても、月額は変わらない" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "tsumitate",
    prompt: "毎月同じ額で買い続けると、値動きはどうなりますか。",
    choices: [
      {
        value: "not-guaranteed",
        label: "買う時期が分かれるだけ。必ず増えることも、元本が守られることもない",
      },
      { value: "always-up", label: "同じ額なら、下がっても必ず取り戻せる" },
      { value: "unknown", label: "わからない" },
    ],
  },
  {
    field: "trustFee",
    prompt: "投資信託の信託報酬は、いつかかるコストですか。",
    choices: [
      {
        value: "ongoing",
        label: "持っている間、信託財産から差し引かれる。買うときの手数料とは別",
      },
      { value: "purchase-only", label: "買うとき以外には、かからない" },
      { value: "unknown", label: "わからない" },
    ],
  },
];

export function isComplete(answers: Partial<Answers>): answers is Answers {
  return (
    answers.purchasingPower !== undefined &&
    answers.compound !== undefined &&
    answers.depositCover !== undefined &&
    answers.accountFiling !== undefined &&
    answers.returnOfCapital !== undefined &&
    answers.nisaHolding !== undefined &&
    answers.pensionDeferral !== undefined &&
    answers.tsumitate !== undefined &&
    answers.trustFee !== undefined
  );
}
