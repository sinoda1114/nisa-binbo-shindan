import type { Verdict } from "./diagnosis/types";
import {
  shareDestinations,
  type ShareDestination,
} from "./share-destinations";

const BLURB: Record<Verdict, string> = {
  loss: "NISA貧乏診断の結果は「今年の非課税枠を取りこぼしています」でした。",
  risky: "NISA貧乏診断の結果は「NISAの使い方に確認したい点があります」でした。",
  ok: "NISA貧乏診断の結果は「今年のNISA枠をおおむね活用できています」でした。",
};

export function shareMessage(verdict: Verdict): string {
  return BLURB[verdict];
}

export function shareTargets(verdict: Verdict): ShareDestination[] {
  return shareDestinations(shareMessage(verdict));
}
