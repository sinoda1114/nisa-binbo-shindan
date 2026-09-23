import type { Verdict } from "./diagnosis/types";
import {
  shareDestinations,
  type ShareDestination,
} from "./share-destinations";

const BLURB: Record<Verdict, string> = {
  loss: "私のNISA貧乏診断です。非課税の枠を、取りこぼしている判定です。",
  risky: "私のNISA貧乏診断です。使い方は、あと一歩で惜しい判定です。",
  ok: "私のNISA貧乏診断です。今年の枠は、使えている判定です。",
};

export function shareMessage(verdict: Verdict): string {
  return BLURB[verdict];
}

export function shareTargets(verdict: Verdict): ShareDestination[] {
  return shareDestinations(shareMessage(verdict));
}
