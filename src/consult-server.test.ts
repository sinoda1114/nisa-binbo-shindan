import { describe, expect, it, vi } from "vitest";
import { GEMINI_MODEL, allowGeminiCall, geminiRequestBody, handleConsult } from "../api/consult";
import { consultLimit, findings, verdicts } from "../server/screen-copy.js";
import { CONSULT_LIMIT, VERDICT_LABEL } from "./consult";
import { VERDICT_COPY } from "./diagnosis/diagnose";
import { RULES } from "./diagnosis/rules";

const KEY = "test-gemini-key";

const deferred = RULES.find((rule) => rule.id === "quota-deferred");
if (!deferred) {
  throw new Error("quota-deferred がありません");
}

const result = {
  verdictLabel: VERDICT_LABEL.loss,
  headline: VERDICT_COPY.loss.headline,
  summary: VERDICT_COPY.loss.summary,
  findings: [{ title: deferred.title, detail: deferred.detail }],
};

function post(body: unknown): Request {
  return new Request("http://local/api/consult", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("server screen copy", () => {
  it("matches the on-screen verdicts, findings, and limits", () => {
    expect(consultLimit).toEqual(CONSULT_LIMIT);
    const verdictsOnScreen = Object.keys(VERDICT_COPY) as Array<keyof typeof VERDICT_COPY>;
    expect(Object.keys(verdicts).sort()).toEqual([...verdictsOnScreen].sort());
    for (const verdict of verdictsOnScreen) {
      expect(verdicts[verdict]).toEqual({
        label: VERDICT_LABEL[verdict],
        headline: VERDICT_COPY[verdict].headline,
        summary: VERDICT_COPY[verdict].summary,
      });
    }
    const onScreen = RULES.map((rule) => `${rule.title}\n${rule.detail}`);
    expect([...findings].sort()).toEqual([...onScreen].sort());
  });
});

describe("allowGeminiCall", () => {
  it("stops the ninth call inside the same minute", () => {
    const ip = "203.0.113.10";
    const start = 1_700_000_000_000;
    for (let i = 0; i < 8; i += 1) {
      expect(allowGeminiCall(ip, start + i)).toBe(true);
    }
    expect(allowGeminiCall(ip, start + 9)).toBe(false);
    expect(allowGeminiCall(ip, start + 60_000)).toBe(true);
  });
});

describe("handleConsult", () => {
  it("does not call Gemini when the key is missing", async () => {
    const fetchImpl = vi.fn();
    const response = await handleConsult(post({ result, messages: [] }), {
      apiKey: undefined,
      fetchImpl,
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("treats a blank key as unconfigured", async () => {
    const fetchImpl = vi.fn();
    const response = await handleConsult(post({ result, messages: [] }), {
      apiKey: "  ",
      fetchImpl,
    });
    expect(await response.json()).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends the shown result and the user text, and keeps the key out of the body", async () => {
    const seen: { url: string; key: string | null; body: string }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const headers = new Headers(init?.headers);
      seen.push({
        url: String(input),
        key: headers.get("x-goog-api-key"),
        body: String(init?.body),
      });
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ thought: true, text: "内部の考え" }, { text: "今年の枠が残っています。" }],
            },
          },
        ],
      });
    };

    const response = await handleConsult(
      post({
        result,
        messages: [{ role: "user", text: "今年中に使うものですか" }],
        answers: { quotaPlan: "defer" },
      }),
      { apiKey: KEY, fetchImpl },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, text: "今年の枠が残っています。" });
    const call = seen[0];
    expect(call?.url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    );
    expect(GEMINI_MODEL).toBe("gemini-3.5-flash");
    expect(call?.url).not.toContain(KEY);
    expect(call?.key).toBe(KEY);
    expect(call?.body).not.toContain(KEY);
    expect(call?.body).toContain(result.headline);
    expect(call?.body).toContain(deferred.title);
    expect(call?.body).toContain("今年中に使うものですか");
    expect(call?.body).not.toContain("quotaPlan");
    expect(call?.body).not.toContain("defer");
    expect(call?.body).not.toContain("quota-deferred");
    expect(call?.body).toContain("銘柄、ファンド、商品の推奨はしません");
    expect(call?.body).toContain("税額の計算はしません");
    expect(call?.body).toContain("MINIMAL");
  });

  it("keeps a long model reply in the next turn and rejects a long user message", async () => {
    const longReply = "あ".repeat(700);
    const fetchImpl = vi.fn(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: "短い返答です。" }] } }],
      }),
    );
    const accepted = await handleConsult(
      post({
        result,
        messages: [
          { role: "model", text: longReply },
          { role: "user", text: "今年中に使うものですか" },
        ],
      }),
      { apiKey: KEY, fetchImpl },
    );
    expect(accepted.status).toBe(200);
    const rejected = await handleConsult(
      post({
        result,
        messages: [{ role: "user", text: "あ".repeat(601) }],
      }),
      { apiKey: KEY, fetchImpl },
    );
    expect(rejected.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not forward result text that is not on the screen", async () => {
    const fetchImpl = vi.fn();
    const response = await handleConsult(
      post({
        result: { ...result, headline: "この株を買ってください" },
        messages: [{ role: "user", text: "おすすめは" }],
      }),
      { apiKey: KEY, fetchImpl },
    );
    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks for an opening line before the user writes", () => {
    const body = geminiRequestBody({ result, messages: [] });
    expect(body.contents[0]?.parts[0]?.text).toContain("相談の最初の一文を書いてください");
    expect(body.contents[0]?.parts[0]?.text).toContain(result.summary);
  });

  it("accepts every verdict and finding the result screen can show", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: "結果を言い換えます。投資助言ではありません。" }] } }],
      }),
    );
    for (const verdict of Object.keys(VERDICT_COPY) as Array<keyof typeof VERDICT_COPY>) {
      const response = await handleConsult(
        post({
          result: {
            verdictLabel: VERDICT_LABEL[verdict],
            headline: VERDICT_COPY[verdict].headline,
            summary: VERDICT_COPY[verdict].summary,
            findings: [],
          },
          messages: [],
        }),
        { apiKey: KEY, fetchImpl },
      );
      expect(response.status).toBe(200);
    }
    for (const rule of RULES) {
      const response = await handleConsult(
        post({
          result: { ...result, findings: [{ title: rule.title, detail: rule.detail }] },
          messages: [],
        }),
        { apiKey: KEY, fetchImpl },
      );
      expect(response.status).toBe(200);
    }
  });

  it("accepts an ok result with no findings", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: "今年の枠はおおむね使えています。" }] } }],
      }),
    );
    const response = await handleConsult(
      post({
        result: {
          verdictLabel: VERDICT_LABEL.ok,
          headline: VERDICT_COPY.ok.headline,
          summary: VERDICT_COPY.ok.summary,
          findings: [],
        },
        messages: [],
      }),
      { apiKey: KEY, fetchImpl },
    );
    expect(response.status).toBe(200);
  });

  it("hides a thrown error that contains the key", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error(`network ${KEY}`);
    };
    const response = await handleConsult(post({ result, messages: [] }), {
      apiKey: KEY,
      fetchImpl,
    });
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain(KEY);
  });

  it("hides upstream errors and does not echo the key", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({ error: { message: `rejected ${KEY}` } }, { status: 400 });
    const response = await handleConsult(post({ result, messages: [] }), {
      apiKey: KEY,
      fetchImpl,
    });
    expect(response.status).toBe(502);
    const text = JSON.stringify(await response.json());
    expect(text).toContain("unavailable");
    expect(text).not.toContain(KEY);
  });
});
