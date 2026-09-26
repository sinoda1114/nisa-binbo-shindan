import { describe, expect, it, vi } from "vitest";
import { GEMINI_MODEL, geminiRequestBody, handleConsult } from "../api/consult";
import { VERDICT_LABEL } from "./consult";
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
