import type { IncomingMessage } from "node:http";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { handleConsult } from "./api/consult";

function readIncoming(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function consultDevApi(): Plugin {
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (path !== "/api/consult") {
      next();
      return;
    }
    void readIncoming(req)
      .then(async (raw) => {
        const request = new Request("http://127.0.0.1/api/consult", {
          method: req.method ?? "GET",
          headers: { "content-type": "application/json" },
          body: req.method === "POST" ? new Uint8Array(raw) : undefined,
        });
        const response = await handleConsult(request);
        res.statusCode = response.status;
        const type = response.headers.get("content-type");
        if (type) {
          res.setHeader("content-type", type);
        }
        res.end(Buffer.from(await response.arrayBuffer()));
      })
      .catch(() => {
        if (!res.headersSent) {
          res.statusCode = 502;
          res.setHeader("content-type", "application/json");
        }
        res.end(JSON.stringify({ ok: false, reason: "unavailable" }));
      });
  };

  return {
    name: "consult-dev-api",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig({
  plugins: [consultDevApi()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
