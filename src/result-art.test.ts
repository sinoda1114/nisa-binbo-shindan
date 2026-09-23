import { describe, expect, it } from "vitest";
import { literacyMood, resultArt, type ResultMood } from "./result-art";

const MOODS: readonly ResultMood[] = ["loss", "risky", "ok"];
const SVG_NS = "http://www.w3.org/2000/svg";

describe("resultArt", () => {
  it("keeps a local badge and character for each mood", () => {
    const badges = new Set<string>();
    const characters = new Set<string>();
    for (const mood of MOODS) {
      const art = resultArt(mood);
      expect(art.badge).toContain("<svg");
      expect(art.character).toContain("<svg");
      expect(art.badge).not.toContain("data-quiver-sandbox");
      expect(art.character).not.toContain("data-quiver-sandbox");
      expect(art.badge.toLowerCase()).not.toContain("<script");
      expect(art.character.toLowerCase()).not.toContain("<script");
      for (const raw of [art.badge, art.character]) {
        const urls = raw.match(/https?:\/\/[^"'\s)]+/g) ?? [];
        expect(urls.every((url) => url === SVG_NS)).toBe(true);
      }
      badges.add(art.badge);
      characters.add(art.character);
    }
    expect(badges.size).toBe(3);
    expect(characters.size).toBe(3);
  });

  it("maps literacy verdicts onto the same three moods", () => {
    expect(literacyMood("gap")).toBe("loss");
    expect(literacyMood("shaky")).toBe("risky");
    expect(literacyMood("solid")).toBe("ok");
  });
});
