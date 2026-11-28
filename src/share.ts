import { utilizationLevel, utilizationMarks } from "./diagnosis/level";
import type { Diagnosis, Verdict } from "./diagnosis/types";
import {
  shareDestinations,
  type ShareDestination,
} from "./share-destinations";

const BLURB: Record<Verdict, string> = {
  loss: "NISA貧乏診断の結果は「今年の非課税枠を取りこぼしています」でした。",
  risky: "NISA貧乏診断の結果は「NISAの使い方に確認したい点があります」でした。",
  ok: "NISA貧乏診断の結果は「今年のNISA枠をおおむね活用できています」でした。",
};

export function shareMessage(
  diagnosis: Pick<Diagnosis, "verdict" | "findings">,
): string {
  const marks = utilizationMarks(utilizationLevel(diagnosis));
  return `${BLURB[diagnosis.verdict]} ${marks}`;
}

export function shareTargets(
  diagnosis: Pick<Diagnosis, "verdict" | "findings">,
): ShareDestination[] {
  return shareDestinations(shareMessage(diagnosis));
}
