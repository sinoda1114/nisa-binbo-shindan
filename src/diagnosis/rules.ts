import type { Answers, Rule } from "./types";

const quotaPossiblyLeft = (answers: Answers) =>
  answers.quotaUse === "none" ||
  answers.quotaUse === "some" ||
  answers.quotaUse === "unknown";

const idleWhileQuotaOpen = (answers: Answers) =>
  answers.account !== "opened" || quotaPossiblyLeft(answers);

const recurringOpen = (answers: Answers) =>
  answers.account === "opened" &&
  answers.frameUse !== "none" &&
  quotaPossiblyLeft(answers);

export const RULES: Rule[] = [
  {
    id: "no-account",
    severity: "loss",
    when: (answers) => answers.account === "none",
    title: "口座が無いので、枠が使えません",
    detail:
      "口座が無いと、つみたて投資枠も成長投資枠も使えません。未使用の年間枠は翌年に繰り越せません。今年中に開設して、枠を使える状態にしてください。",
  },
  {
    id: "planning-only",
    severity: "risk",
    when: (answers) => answers.account === "planning",
    title: "開設予定のまま、枠を使えていません",
    detail:
      "開設が終わるまで、今年の枠は使えません。未使用分は翌年に繰り越せません。手続きを進めて、今年中に枠へ入れる状態にしてください。",
  },
  {
    id: "unused-quota",
    severity: "loss",
    when: (answers) => answers.account === "opened" && answers.quotaUse === "none",
    title: "今年の枠、ほぼ未使用です",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円です。ほとんど使っていないと、今年の非課税枠は年越しで消えます。今年中に使うかを見てください。何を買うかは述べません。",
  },
  {
    id: "partial-quota",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.quotaUse === "some",
    title: "枠の半分が、まだ残っています",
    detail:
      "未使用分は翌年に繰り越せません。残りの枠を今年中に使うかを見てください。",
  },
  {
    id: "unknown-quota",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.quotaUse === "unknown",
    title: "今年の枠、使ったか不明です",
    detail:
      "残枠がわからないまま年を越すと、未使用に気づけません。証券会社の画面で今年の残枠を見てください。",
  },
  {
    id: "idle-cash-lots",
    severity: "loss",
    when: (answers) => answers.idleCash === "lots" && idleWhileQuotaOpen(answers),
    title: "投資したいお金が、預金で昼寝しています",
    detail:
      "かなりの現金が預金のままです。枠が残っているなら、預金のままにしないかを見てください。何をいくら買うかは述べません。",
  },
  {
    id: "idle-cash-some",
    severity: "risk",
    when: (answers) => answers.idleCash === "some" && idleWhileQuotaOpen(answers),
    title: "投資したいお金が、少し預金に残っています",
    detail: "枠が残っているなら、その分を預金のままにしないかを見てください。",
  },
  {
    id: "taxable-while-quota-left",
    severity: "loss",
    when: (answers) =>
      answers.taxableLeak === "yes" &&
      answers.account === "opened" &&
      quotaPossiblyLeft(answers),
    title: "別の口座でも、買っています",
    detail:
      "特定口座や一般口座など、NISAではない口座で買うと、非課税の枠を使いません。残枠があるうちは、NISAの口座側で買うかを見てください。銘柄は勧めません。",
  },
  {
    id: "frame-unsure",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "unsure",
    title: "2つの枠の違いが、まだ曖昧です",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円です。違いが曖昧だと、片方を未使用のままにしがちです。どちらの枠を使っているかを見てください。",
  },
  {
    id: "growth-without-tsumitate",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "growth",
    title: "成長投資枠ばかりで、つみたて側が静かです",
    detail:
      "つみたて投資枠は年120万円です。使わないままだと、その分は年越しで消えます。つみたて側の残枠も見てください。",
  },
  {
    id: "opened-but-not-buying",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "none",
    title: "口座はあるのに、まだ買っていません",
    detail:
      "開設済みでも買っていなければ、今年の枠は未使用です。未使用分は翌年に繰り越せません。今年中に枠を使うかを見てください。銘柄や買い時は述べません。",
  },
  {
    id: "recurring-paused",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "paused",
    title: "つみたて、いったん停止中です",
    detail:
      "定期買付が止まっていると、今年の枠は使われないまま進みます。未使用分は翌年に繰り越せません。設定を戻すかを見てください。何を積むかは述べません。",
  },
  {
    id: "recurring-never",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "never",
    title: "つみたての設定が、まだありません",
    detail:
      "設定が無いと、買付は記憶頼みです。今年の枠は年越しで消えます。動かすかを見てください。何を積むかは述べません。",
  },
  {
    id: "recurring-unknown",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "unknown",
    title: "つみたてが動いているか、不明です",
    detail:
      "止まっていると、今年の枠は未使用のまま年を越します。証券会社のつみたて設定を見てください。",
  },
  {
    id: "sold-and-stopped",
    severity: "loss",
    when: (answers) => answers.account === "opened" && answers.soldThisYear === "stopped",
    title: "売った分の枠は、今年は戻りません",
    detail:
      "今年使った年間枠は、売っても戻ってきません。残枠があるなら、今年中に使うかを見てください。何を買い直すかは述べません。",
  },
  {
    id: "broker-cash-lots",
    severity: "loss",
    when: (answers) => answers.brokerCash === "lots" && idleWhileQuotaOpen(answers),
    title: "証券会社の中で、お金が昼寝しています",
    detail:
      "入金しただけでは、枠は減りません。買っていない現金は、預金のままと同じです。枠が残っているなら、入れたままにしないかを見てください。何を買うかは述べません。",
  },
  {
    id: "broker-cash-some",
    severity: "risk",
    when: (answers) => answers.brokerCash === "some" && idleWhileQuotaOpen(answers),
    title: "証券会社に、まだ買っていないお金が少しあります",
    detail:
      "入金と買付は別です。現金が残っていて枠も残っているなら、買うかを見てください。銘柄は勧めません。",
  },
  {
    id: "other-broker",
    severity: "loss",
    when: (answers) =>
      answers.account === "opened" &&
      answers.sameBroker === "other" &&
      quotaPossiblyLeft(answers),
    title: "NISAと別の会社で、買っています",
    detail:
      "今年のNISAは、一つの証券会社だけです。別の会社での買付は、NISAの非課税枠を使いません。残枠があるなら、NISAを開設している会社で買うかを見てください。銘柄は勧めません。",
  },
  {
    id: "dividend-taxed",
    severity: "loss",
    when: (answers) =>
      answers.account === "opened" && answers.dividendRoute === "other",
    title: "配当の受け取り方が、課税ルートです",
    detail:
      "株式数比例配分方式以外だと、NISAの株の配当にも税金がかかることがあります。方式を証券会社で見てください。銘柄は勧めません。",
  },
];
