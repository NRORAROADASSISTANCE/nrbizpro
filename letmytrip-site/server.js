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

// Serve the homepage with the small UI cleanup script without changing the original page theme.
app.get(["/", "/index.html"], (req, res, next) => {
  fs.readFile(path.join(ROOT, "index.html"), "utf8", (err, html) => {
    if (err) return next(err);
    const tag = '<script src="/homepage-polish.js" defer></script>';
    const bodyClose = html.toLowerCase().lastIndexOf("</body>");
    const output = bodyClose >= 0
      ? html.slice(0, bodyClose) + tag + html.slice(bodyClose)
      : html + tag;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(output);
  });
});
app.use(express.static(ROOT, { extensions: ["html"], index: "index.html" }));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "letmytrip" }));
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found" });
  return res.status(404).send("Page not found");
});

app.listen(PORT, "0.0.0.0", () => console.log("LETMYTRIP server listening on port " + PORT));
