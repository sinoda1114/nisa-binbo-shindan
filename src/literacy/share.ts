import {
  shareDestinations,
  type ShareDestination,
} from "../share-destinations";
import type { Verdict } from "./types";

export { linkToCopy, PUBLIC_URL as PUBLIC_PAGE_URL } from "../share-destinations";

const BLURB: Record<Verdict, string> = {
  gap: "私の金融リテラシー診断です。誤解がありそう、という結果です。",
  shaky: "私の金融リテラシー診断です。確認した方がよさそう、という結果です。",
  solid: "私の金融リテラシー診断です。概ね合っている、という結果です。",
};

export function shareMessage(verdict: Verdict): string {
  return BLURB[verdict];
}

export function shareTargets(verdict: Verdict): ShareDestination[] {
  return shareDestinations(shareMessage(verdict));
}
