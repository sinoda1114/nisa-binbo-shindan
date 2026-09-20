import type { Answers, Rule } from "./types";

const quotaLeft = (answers: Answers) =>
  answers.quotaUse === "none" || answers.quotaUse === "some";

const idleWhileQuotaOpen = (answers: Answers) =>
  answers.account !== "opened" || quotaLeft(answers);

export const RULES: Rule[] = [
  {
    id: "no-account",
    severity: "loss",
    when: (answers) => answers.account === "none",
    title: "NISA口座が開設されていません",
    detail:
      "口座が無いと、つみたて投資枠（年120万円）も成長投資枠（年240万円）も使えません。未使用の年間枠は翌年に繰り越せないため、開設していない期間は非課税の恩恵を取りこぼしている可能性があります。",
  },
  {
    id: "planning-only",
    severity: "risk",
    when: (answers) => answers.account === "planning",
    title: "開設の予定だけで、まだ枠を使えていません",
    detail:
      "これから開設する場合、開設が終わるまで年間投資枠は使えません。未使用の年間枠は翌年に繰り越せません。開設が遅れると、今年の枠を取りこぼす可能性があります。進み具合を確認してほしい点です。",
  },
  {
    id: "unused-quota",
    severity: "loss",
    when: (answers) => answers.account === "opened" && answers.quotaUse === "none",
    title: "今年の年間投資枠がほぼ未使用です",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円、合計は年360万円です。未使用の年間枠は翌年に繰り越せません。ほとんど使っていないと、今年の非課税枠を取りこぼしている可能性があります。",
  },
  {
    id: "partial-quota",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.quotaUse === "some",
    title: "今年の年間投資枠が半分程度しか使われていません",
    detail:
      "年間枠の未使用分は翌年に繰り越せません。半分くらいの使用だと、残りの枠を取りこぼす可能性があります。残枠の有無を確認してほしい点です。",
  },
  {
    id: "idle-cash-lots",
    severity: "loss",
    when: (answers) => answers.idleCash === "lots" && idleWhileQuotaOpen(answers),
    title: "投資するつもりのお金が、かなり預金のまま置かれています",
    detail:
      "かなりの現金が預金のままだと、NISAの枠が空いている場合、非課税の置き場所を使えていない可能性があります。未使用の年間枠は翌年に繰り越せません。何を買うかは述べません。枠が空いていないかを確認してほしい点です。",
  },
  {
    id: "idle-cash-some",
    severity: "risk",
    when: (answers) => answers.idleCash === "some" && idleWhileQuotaOpen(answers),
    title: "投資するつもりのお金が、少し預金のまま残っています",
    detail:
      "投資するつもりで預金に置いていると、NISAの枠が残っている場合は非課税の恩恵を取りこぼす可能性があります。置き場所として枠が空いていないかを確認してほしい点です。",
  },
  {
    id: "taxable-while-quota-left",
    severity: "loss",
    when: (answers) =>
      answers.taxableLeak === "yes" && answers.account === "opened" && quotaLeft(answers),
    title: "NISAの枠が残っているのに、課税口座側で買っています",
    detail:
      "年間枠が残っているのに課税口座で買っていると、同じ買い付けでも非課税の恩恵を使えていない可能性があります。つみたて投資枠は年120万円、成長投資枠は年240万円です。枠の残量を確認してほしい点です。",
  },
  {
    id: "frame-unsure",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "unsure",
    title: "つみたて投資枠と成長投資枠の違いが分かっていません",
    detail:
      "つみたて投資枠は年120万円、成長投資枠は年240万円です。枠の違いが分からないと、片方だけを使ったまま残枠を空にしたり、課税口座側で買ったりする可能性があります。どちらの枠を使っているかを確認してほしい点です。",
  },
  {
    id: "growth-without-tsumitate",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "growth",
    title: "成長投資枠が中心で、つみたて投資枠の使用が見えません",
    detail:
      "成長投資枠は年240万円、つみたて投資枠は年120万円です。成長投資枠が中心だと、つみたて投資枠が未使用のまま残っている可能性があります。未使用の年間枠は翌年に繰り越せません。両方の枠の使用状況を確認してほしい点です。",
  },
  {
    id: "opened-but-not-buying",
    severity: "risk",
    when: (answers) => answers.account === "opened" && answers.frameUse === "none",
    title: "口座は開設していますが、まだ買っていません",
    detail:
      "開設済みでも買っていなければ、今年の年間投資枠は未使用のままです。未使用の年間枠は翌年に繰り越せません。買い時や銘柄は述べません。枠が空いたままになっていないかを確認してほしい点です。",
  },
];
