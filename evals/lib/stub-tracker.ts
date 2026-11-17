// Frozen tracker for stage 1. The live tracker has random 5xx and changes, so it cannot be an eval input: this server
// answers exactly like it (GET /, /tasks/<id>, /bugs/<id>) from one committed tracker.json.
import * as fs from "fs";
import * as http from "http";

export interface StubTracker {
  baseUrl: string;
  close(): Promise<void>;
}

export async function startStubTracker(trackerJson: string, key: string): Promise<StubTracker> {
  const record = fs.readFileSync(trackerJson, "utf8").trim();
  const m = /^(TASK|BUG)-(\d+)$/.exec(key);
  if (!m) throw new Error(`bad issue key ${key}`);
  const route = `/${m[1] === "BUG" ? "bugs" : "tasks"}/${m[2]}`;
  const server = http.createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0]!;
    if (req.method === "GET" && url === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("eval tracker ok");
    } else if (req.method === "GET" && url === route) {
      res.writeHead(200, { "content-type": "application/json" }).end(record);
    } else {
      res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ status: "error", message: "not found" }));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const port = (server.address() as { port: number }).port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
