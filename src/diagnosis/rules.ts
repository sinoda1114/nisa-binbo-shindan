import type { Answers, Rule } from "./types";

const annualQuotaUnused = (answers: Answers) => answers.quotaUse === "none";

const quotaPossiblyLeft = (answers: Answers) =>
  answers.quotaUse === "none" ||
  answers.quotaUse === "some" ||
  answers.quotaUse === "unknown";

/**
 * 枠別の指摘を、年間枠の判定にどう重ねるか。
 * stack-while-left は残りそうなら出す。ほぼ未使用でも unused-quota と並べる。
 * defer-when-unused はほとんど未使用なら unused-quota に譲る。
 */
type AnnualOverlap = "stack-while-left" | "defer-when-unused";

function annualOverlapAllows(answers: Answers, overlap: AnnualOverlap): boolean {
  switch (overlap) {
    case "stack-while-left":
      return quotaPossiblyLeft(answers);
    case "defer-when-unused":
      return !annualQuotaUnused(answers);
    default: {
      const unreachable: never = overlap;
      return unreachable;
    }
  }
}

const recurringOpen = (answers: Answers) =>
  answers.frameUse !== "none" && quotaPossiblyLeft(answers);

export const RULES: Rule[] = [
  {
    id: "unused-quota",
    severity: "loss",
    when: (answers) => annualQuotaUnused(answers),
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
    id: "tsumitate-small",
    severity: "risk",
    when: (answers) =>
      answers.tsumitateAmount === "symbolic" &&
      annualOverlapAllows(answers, "stack-while-left"),
    title: "積立額が、年120万円に届いていません",
    detail:
      "積立額が小さく、つみたて投資枠の年120万円に届いていません。未使用分は翌年に繰り越せません。何を積むかは述べません。",
  },
  {
    id: "growth-quota-left",
    severity: "risk",
    when: (answers) =>
      (answers.growthQuota === "none" || answers.growthQuota === "some") &&
      annualOverlapAllows(answers, "defer-when-unused"),
    title: "成長投資枠が、まだ残っています",
    detail:
      "成長投資枠が残っています。未使用分は翌年に繰り越せません。銘柄は勧めません。",
  },
  {
    id: "idle-cash-lots",
    severity: "loss",
    when: (answers) => answers.idleCash === "lots" && quotaPossiblyLeft(answers),
    title: "投資に使う予定のお金が、預金口座に残っています",
    detail:
      "かなりの現金が預金のままです。枠が残っているなら、そのお金を今年のNISA枠で使うか検討してください。何をいくら買うかは述べません。",
  },
  {
    id: "idle-cash-some",
    severity: "risk",
    when: (answers) => answers.idleCash === "some" && quotaPossiblyLeft(answers),
    title: "投資したいお金が、少し預金に残っています",
    detail: "枠が残っているなら、そのお金を今年のNISA枠で使うか検討してください。",
  },
  {
    id: "taxable-while-quota-left",
    severity: "loss",
    when: (answers) =>
      answers.taxableLeak === "yes" && quotaPossiblyLeft(answers),
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
    id: "not-yet-buying",
    severity: "risk",
    when: (answers) => answers.frameUse === "none",
    title: "口座はあるのに、まだ買っていません",
    detail:
      "開設済みでも買っていなければ、今年の枠は未使用です。未使用分は翌年に繰り越せません。今年中に枠を使うか検討してください。銘柄や買い時は述べません。",
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
    title: "売った分の枠は、今年は戻りません",
    detail:
      "今年使った年間枠は、売っても戻ってきません。残枠があるなら、今年中に使うか検討してください。何を買い直すかは述べません。",
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
      answers.sameBroker === "other" && quotaPossiblyLeft(answers),
    title: "NISAと別の会社で、買っています",
    detail:
      "今年のNISA口座を利用できる金融機関は、1つです。別の会社での買付は、NISAの非課税枠を使いません。残枠があるなら、NISAを開設している会社で買うか検討してください。銘柄は勧めません。",
  },
  {
    id: "dividend-taxed",
    severity: "loss",
    when: (answers) => answers.dividendRoute === "other",
    title: "配当金の受取方式によっては課税されます",
    detail:
      "株式数比例配分方式以外だと、NISAの株の配当にも税金がかかることがあります。受取方式を証券会社で確認してください。銘柄は勧めません。",
  },
];
