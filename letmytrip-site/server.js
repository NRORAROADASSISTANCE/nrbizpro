const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const ROOT = __dirname;
const API_DIR = path.join(ROOT, "api");
const PORT = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Adapt the existing Vercel-style API handlers to a normal Node.js web service.
if (fs.existsSync(API_DIR)) {
  for (const file of fs.readdirSync(API_DIR)) {
    if (!file.endsWith(".js") || file.startsWith("_")) continue;
    const endpoint = path.basename(file, ".js");
    const handler = require(path.join(API_DIR, file));
    if (typeof handler !== "function") continue;
    app.all("/api/" + endpoint, (req, res) => Promise.resolve(handler(req, res)).catch((err) => {
      console.error("API handler failed:", endpoint, err);
      if (!res.headersSent) res.status(500).json({ error: "Server error" });
    }));
    app.all("/api/" + endpoint + "/", (req, res) => Promise.resolve(handler(req, res)).catch((err) => {
      console.error("API handler failed:", endpoint, err);
      if (!res.headersSent) res.status(500).json({ error: "Server error" });
    }));
  }
}

app.use(express.static(ROOT, { extensions: ["html"], index: "index.html" }));
app.get("/", (_req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "letmytrip" }));
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found" });
  return res.status(404).send("Page not found");
});

app.listen(PORT, "0.0.0.0", () => console.log("LETMYTRIP server listening on port " + PORT));
