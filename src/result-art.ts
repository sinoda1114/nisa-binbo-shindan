import badgeLoss from "./assets/result/badge-loss.svg?raw";
import badgeOk from "./assets/result/badge-ok.svg?raw";
import badgeRisky from "./assets/result/badge-risky.svg?raw";
import characterLoss from "./assets/result/character-loss.svg?raw";
import characterOk from "./assets/result/character-ok.svg?raw";
import characterRisky from "./assets/result/character-risky.svg?raw";

export type ResultMood = "loss" | "risky" | "ok";

export type LiteracyVerdict = "gap" | "shaky" | "solid";

const ART: Record<ResultMood, { badge: string; character: string }> = {
  loss: { badge: badgeLoss, character: characterLoss },
  risky: { badge: badgeRisky, character: characterRisky },
  ok: { badge: badgeOk, character: characterOk },
};

export function resultArt(mood: ResultMood): { badge: string; character: string } {
  return ART[mood];
}

export function literacyMood(verdict: LiteracyVerdict): ResultMood {
  switch (verdict) {
    case "gap":
      return "loss";
    case "shaky":
      return "risky";
    case "solid":
      return "ok";
    default: {
      const unreachable: never = verdict;
      return unreachable;
    }
  }
}

function adoptSvg(raw: string): SVGElement {
  const parsed = new DOMParser().parseFromString(raw, "image/svg+xml");
  const root = parsed.documentElement;
  if (root.namespaceURI !== "http://www.w3.org/2000/svg" || root.localName !== "svg") {
    throw new Error("結果の絵を表示できません");
  }
  const svg = document.importNode(root, true);
  if (!(svg instanceof SVGElement)) {
    throw new Error("結果の絵を表示できません");
  }
  svg.querySelectorAll("script, foreignObject").forEach((node) => {
    node.remove();
  });
  svg.setAttribute("focusable", "false");
  return svg;
}

function artFrame(className: string, raw: string): HTMLElement {
  const frame = document.createElement("div");
  frame.className = className;
  frame.setAttribute("aria-hidden", "true");
  frame.append(adoptSvg(raw));
  return frame;
}

export function resultBadge(mood: ResultMood): HTMLElement {
  return artFrame("result-badge", ART[mood].badge);
}

export function resultCharacter(mood: ResultMood): HTMLElement {
  return artFrame("result-character", ART[mood].character);
}
