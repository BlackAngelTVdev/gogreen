import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCommits } from "./lib/commit-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT ?? 3000);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

async function serveStaticFile(response, filePath) {
  try {
    const extension = path.extname(filePath);
    const contentType = contentTypes.get(extension) ?? "application/octet-stream";
    const content = await readFile(filePath);

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET") {
    if (url.pathname === "/" || url.pathname === "/index.html") {
      await serveStaticFile(response, path.join(publicDir, "index.html"));
      return;
    }

    if (url.pathname === "/faker" || url.pathname === "/faker.html") {
      await serveStaticFile(response, path.join(publicDir, "faker.html"));
      return;
    }

    if (url.pathname === "/art" || url.pathname === "/art.html") {
      await serveStaticFile(response, path.join(publicDir, "art.html"));
      return;
    }

    if (url.pathname === "/app.js") {
      await serveStaticFile(response, path.join(publicDir, "app.js"));
      return;
    }
  }

  if (request.method === "POST" && url.pathname === "/generate") {
    try {
      const payload = await readJsonBody(request);
      const result = await generateCommits({
        repoUrl: String(payload.repoUrl ?? "").trim(),
        startDay: String(payload.startDay ?? "").trim(),
        endDay: String(payload.endDay ?? "").trim(),
        count: Number(payload.count),
        messageBase: String(payload.messageBase ?? "update").trim() || "update",
      });

      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: String(error?.message ?? error),
      });
    }
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, () => {
  console.log(`goGreen running at http://localhost:${port}`);
});
