import type { Answers, Rule } from "./types";

export const RULES: Rule[] = [
  {
    id: "purchasing-power-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.purchasingPower === "nominal-only",
    title: "預金の数字と、買える量は別です",
    detail:
      "物価が上がると、預金額の表示が同じでも買える量は減ることがあります。何を買うかは述べません。物価の動きは、統計で確認してほしいです。",
  },
  {
    id: "purchasing-power-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.purchasingPower === "unknown",
    title: "物価と預金の関係が未確認です",
    detail:
      "物価が上がると、同じ金額で買える量が減ることがあります。何を買うかは述べません。物価の動きを確認してほしいです。",
  },
  {
    id: "compound-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.compound === "principal-only",
    title: "複利は、利息にも利息がつく仕組みです",
    detail:
      "すでについた利息が、次の利息の計算に含まれるのが複利です。商品の利回りや、いくら置くかは述べません。",
  },
  {
    id: "compound-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.compound === "unknown",
    title: "複利の意味が未確認です",
    detail:
      "複利は、元本だけでなく、すでについた利息にも次の利息がつく仕組みです。利回りの数字は述べません。",
  },
  {
    id: "deposit-cover-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.depositCover === "everything",
    title: "預金保険は、銀行の全商品を守るわけではありません",
    detail:
      "利息のつく円の普通預金や定期預金などは、1つの金融機関ごとに、預金者1人あたり元本1,000万円までと破綻日までの利息等が保護の対象です。無利息・要求払い・決済サービスの決済用預金は全額保護です。投資信託と外貨預金は対象外です。残高の内訳を確認してほしいです。",
  },
  {
    id: "deposit-cover-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.depositCover === "unknown",
    title: "預金保険の範囲が未確認です",
    detail:
      "円の一般預金等は、1つの金融機関ごとに元本1,000万円までと破綻日までの利息等が保護の対象です。決済用預金は全額、投資信託と外貨預金は対象外です。自分の商品の種類を確認してほしいです。",
  },
  {
    id: "account-filing-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.accountFiling === "always-same",
    title: "特定口座と一般口座は、申告の手続きが違います",
    detail:
      "源泉徴収ありの特定口座にある上場株式等の譲渡所得は、原則として確定申告を不要にできます。他の口座と損益通算する場合や、損失の繰越控除を使う場合は申告が必要です。一般口座は、自分で計算して申告します。口座の種類を確認してほしいです。",
  },
  {
    id: "account-filing-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.accountFiling === "unknown",
    title: "口座ごとの申告の違いが未確認です",
    detail:
      "源泉徴収ありの特定口座は原則として申告不要にでき、一般口座は自分で計算して申告します。損益通算や繰越控除を使うときは、源泉徴収ありでも申告が必要です。自分の口座を確認してほしいです。",
  },
  {
    id: "return-of-capital-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.returnOfCapital === "extra-profit",
    title: "元本払戻金は、利益の分配とは限りません",
    detail:
      "追加型の投資信託では、元本払戻金（特別分配金）は元本の払い戻しに相当し、その分だけ個別元本が減ります。普通分配金とは扱いが違います。分配金の内訳は、報告書で確認してほしいです。",
  },
  {
    id: "return-of-capital-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.returnOfCapital === "unknown",
    title: "元本払戻金の意味が未確認です",
    detail:
      "元本払戻金（特別分配金）は利益そのものではなく、元本の払い戻しとして個別元本が減ることがあります。自分の分配の内訳を確認してほしいです。",
  },
  {
    id: "nisa-holding-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.nisaHolding === "still-capped",
    title: "2024年からのNISAの非課税保有期間は無期限です",
    detail:
      "2023年までの一般NISAは最長5年、つみたてNISAは最長20年でした。2024年からのNISAは、非課税で持てる期間が無期限です。2023年以前に買った分の期限は別です。どの枠の残高かを確認してほしいです。",
  },
  {
    id: "nisa-holding-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.nisaHolding === "unknown",
    title: "NISAの非課税で持てる期間が未確認です",
    detail:
      "2024年からのNISAは非課税保有期間が無期限です。2023年までの一般NISAは最長5年、つみたてNISAは最長20年でした。自分の残高がどちらかを確認してほしいです。",
  },
  {
    id: "pension-deferral-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.pensionDeferral === "flat",
    title: "老齢年金は、受け取りを遅らせると増額される仕組みがあります",
    detail:
      "老齢基礎年金と老齢厚生年金は、65歳で受け取らずに遅らせると、1か月あたり0.7%増額されます。繰下げの上限は原則75歳です。昭和27年4月1日以前生まれの人は上限が70歳です。特別支給の老齢厚生年金に繰下げはありません。自分の場合は、日本年金機構の案内を確認してほしいです。",
  },
  {
    id: "pension-deferral-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.pensionDeferral === "unknown",
    title: "年金の繰下げが未確認です",
    detail:
      "老齢基礎年金と老齢厚生年金は、受け取りを1か月遅らせるごとに0.7%増える仕組みです。上限は原則75歳で、生年月日によっては、上限が70歳の人もいます。日本年金機構の案内を確認してほしいです。",
  },
  {
    id: "tsumitate-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.tsumitate === "always-up",
    title: "同じ額で買い続けても、値動きは消えません",
    detail:
      "買う時期を分けるだけで、必ず増えることや元本が守られることは意味しません。何をいくら買うかは述べません。元本保証の有無は、その商品の説明で確認してほしいです。",
  },
  {
    id: "tsumitate-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.tsumitate === "unknown",
    title: "分けて買うことの意味が未確認です",
    detail:
      "毎月同じ額で買うことは、購入の時期を分けるだけです。必ず増えることや、元本が守られることは意味しません。商品の説明を確認してほしいです。",
  },
  {
    id: "trust-fee-wrong",
    severity: "gap",
    when: (answers: Answers) => answers.trustFee === "purchase-only",
    title: "信託報酬は、持っている間にかかるコストです",
    detail:
      "信託報酬は、購入時手数料とは別に、保有中に信託財産から差し引かれるのが一般的です。料率は商品ごとに違います。この診断は料率を計算しません。目論見書を確認してほしいです。",
  },
  {
    id: "trust-fee-unknown",
    severity: "shaky",
    when: (answers: Answers) => answers.trustFee === "unknown",
    title: "信託報酬のかかり方が未確認です",
    detail:
      "信託報酬は、買うときの手数料とは別に、持っている間に差し引かれるコストです。料率は商品ごとに違います。目論見書を確認してほしいです。",
  },
];
