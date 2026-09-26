import type { Answers, Rule } from "./types";

const quotaPossiblyLeft = (answers: Answers) =>
  answers.quotaUse === "none" ||
  answers.quotaUse === "some" ||
  answers.quotaUse === "unknown";

const recurringOpen = (answers: Answers) =>
  answers.frameUse !== "none" && quotaPossiblyLeft(answers);

export const RULES: Rule[] = [
  {
    id: "unused-quota",
    severity: "loss",
    when: (answers) => answers.quotaUse === "none",
    title: "今年の枠、ほぼ未使用です",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円です。ほとんど使っていないと、今年の非課税枠は年越しで消えます。今年中に枠を使うか検討してください。何を買うかは述べません。",
  },
  {
    id: "partial-quota",
    severity: "risk",
    when: (answers) => answers.quotaUse === "some",
    title: "枠の半分が、まだ残っています",
    detail:
      "未使用分は翌年に繰り越せません。残りの枠を今年中に使うか検討してください。",
  },
  {
    id: "unknown-quota",
    severity: "risk",
    when: (answers) => answers.quotaUse === "unknown",
    title: "今年のNISA枠の使用状況がわかっていません",
    detail:
      "残りの枠がわからないまま年を越すと、未使用に気づけません。証券会社の画面で、今年の残りの枠を確認してください。",
  },
  {
    id: "quota-deferred",
    severity: "loss",
    when: (answers) => answers.quotaPlan === "defer" && quotaPossiblyLeft(answers),
    title: "今年の枠を、来年に回そうとしています",
    detail:
      "未使用の年間枠は翌年に繰り越せません。来年に回すと、今年の分は使えなくなります。残っているなら、今年中に使うか検討してください。",
  },
  {
    id: "quota-undecided",
    severity: "risk",
    when: (answers) =>
      (answers.quotaPlan === "undecided" || answers.quotaPlan === "unknown") &&
      quotaPossiblyLeft(answers),
    title: "今年の枠を年内に使うか、まだ決まっていません",
    detail:
      "決めないまま年を越すと、未使用のまま消えます。残りの枠を今年中に使うか決めてください。",
  },
  {
    id: "idle-cash-lots",
    severity: "loss",
    when: (answers) => answers.idleCash === "lots" && quotaPossiblyLeft(answers),
    title: "預金口座に、お金が残っています",
    detail:
      "預金には、生活に必要なお金と、投資に回せるお金があります。枠が残っているなら、投資に回せる分だけを今年のNISA枠で使うか検討してください。生活費や近い支出まで枠に入れる必要はありません。何をいくら買うかは述べません。",
  },
  {
    id: "idle-cash-some",
    severity: "risk",
    when: (answers) => answers.idleCash === "some" && quotaPossiblyLeft(answers),
    title: "預金口座に、お金が少し残っています",
    detail:
      "枠が残っているなら、生活に必要なお金を残したうえで、投資に回せる分を今年のNISA枠で使うか検討してください。",
  },
  {
    id: "taxable-while-quota-left",
    severity: "loss",
    when: (answers) =>
      answers.taxableLeak === "yes" &&
      quotaPossiblyLeft(answers),
    title: "NISA以外の口座でも買付しています",
    detail:
      "特定口座や一般口座など、NISAではない口座で買うと、非課税の枠を使いません。残枠があるうちは、NISA口座で買うか検討してください。銘柄は勧めません。",
  },
  {
    id: "frame-unsure",
    severity: "risk",
    when: (answers) => answers.frameUse === "unsure",
    title: "2つの枠の違いが、まだ曖昧です",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円です。違いが曖昧だと、片方を未使用のままにしがちです。どちらの枠を使っているか確認してください。",
  },
  {
    id: "growth-without-tsumitate",
    severity: "risk",
    when: (answers) => answers.frameUse === "growth",
    title: "成長投資枠を中心に使っています",
    detail:
      "つみたて投資枠は年120万円です。使わないままだと、その分は年越しで消えます。つみたて投資枠の残りも確認してください。",
  },
  {
    id: "not-buying",
    severity: "risk",
    when: (answers) => answers.frameUse === "none",
    title: "まだ買っていません",
    detail:
      "買っていなければ、今年の枠は未使用です。未使用分は翌年に繰り越せません。今年中に枠を使うか検討してください。銘柄や買い時は述べません。",
  },
  {
    id: "recurring-paused",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "paused",
    title: "定期買付（積立）を停止しています",
    detail:
      "定期買付が止まっていると、今年の枠は使われないまま進みます。未使用分は翌年に繰り越せません。定期買付を再開するか検討してください。何を積むかは述べません。",
  },
  {
    id: "recurring-never",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "never",
    title: "つみたての設定が、まだありません",
    detail:
      "購入のたびに手続きが必要です。今年の枠は年越しで消えます。定期買付を設定するか検討してください。何を積むかは述べません。",
  },
  {
    id: "recurring-unknown",
    severity: "risk",
    when: (answers) => recurringOpen(answers) && answers.recurring === "unknown",
    title: "定期買付の設定状況がわかっていません",
    detail:
      "止まっていると、今年の枠は未使用のまま年を越します。証券会社の定期買付の設定を確認してください。",
  },
  {
    id: "sold-and-stopped",
    severity: "loss",
    when: (answers) => answers.soldThisYear === "stopped",
    title: "売っても、今年の枠は戻りません",
    detail:
      "今年の年間枠は、売っても戻ってきません。残枠があるなら、今年中に使うか検討してください。何を買い直すかは述べません。",
  },
  {
    id: "broker-cash-lots",
    severity: "loss",
    when: (answers) => answers.brokerCash === "lots" && quotaPossiblyLeft(answers),
    title: "証券口座に、買付に使っていない現金があります",
    detail:
      "入金しただけでは、枠は減りません。買っていない現金は、預金のままと同じです。枠が残っているなら、証券口座の現金を買付に使うか検討してください。何を買うかは述べません。",
  },
  {
    id: "broker-cash-some",
    severity: "risk",
    when: (answers) => answers.brokerCash === "some" && quotaPossiblyLeft(answers),
    title: "証券口座に、まだ買付に使っていない現金が少しあります",
    detail:
      "入金と買付は別です。現金が残っていて枠も残っているなら、買付に使うか検討してください。銘柄は勧めません。",
  },
  {
    id: "other-broker",
    severity: "loss",
    when: (answers) =>
      answers.sameBroker === "other" &&
      quotaPossiblyLeft(answers),
    title: "NISAと別の会社で、買っています",
    detail:
      "今年のNISA口座を利用できる金融機関は、1つです。別の会社での買付は、NISAの非課税枠を使いません。残枠があるなら、NISAを開設している会社で買うか検討してください。銘柄は勧めません。",
  },
  {
    id: "dividend-taxed",
    severity: "loss",
    when: (answers) => answers.dividendRoute === "other",
    title: "配当金の受取先によっては課税されます",
    detail:
      "証券会社の口座（株式数比例配分方式）以外で受け取ると、NISAの株の配当にも税金がかかることがあります。受取先を証券会社で確認してください。銘柄は勧めません。",
  },
];
