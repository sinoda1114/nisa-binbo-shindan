import {
  shareDestinations,
  type ShareDestination,
} from "../share-destinations";
import type { Verdict } from "./types";

export { linkToCopy, PUBLIC_URL as PUBLIC_PAGE_URL } from "../share-destinations";

const BLURB: Record<Verdict, string> = {
  gap: "金融リテラシー診断の結果は「誤解がありそうです」でした。",
  shaky: "金融リテラシー診断の結果は「確認した方がよさそうです」でした。",
  solid: "金融リテラシー診断の結果は「概ね合っています」でした。",
};

export function shareMessage(verdict: Verdict): string {
  return BLURB[verdict];
}

export function shareTargets(verdict: Verdict): ShareDestination[] {
  return shareDestinations(shareMessage(verdict));
}
