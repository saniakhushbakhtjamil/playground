"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const VALID_STATUSES = ["new", "approved", "dismissed"];
const MAX_FIELD = 200;
const MAX_MESSAGE = 1000;
const MAX_ITEMS = 20;
function clean(v, max) {
    return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function notifySlack(text) {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url)
        return;
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    }).catch((err) => console.error("slack notify failed:", err));
}
// POST /api/access-requests  — public (proxied through the portfolio nginx)
router.post("/", (req, res) => {
    const body = req.body;
    // Honeypot: bots fill every field. Pretend success, store nothing.
    if (clean(body.website, MAX_FIELD)) {
        return res.json({ ok: true });
    }
    const name = clean(body.name, MAX_FIELD);
    const email = clean(body.email, MAX_FIELD);
    const github_username = clean(body.github_username, MAX_FIELD).replace(/^@/, "");
    const message = clean(body.message, MAX_MESSAGE);
    if (!name)
        return res.status(400).json({ error: "Name is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email is required" });
    }
    const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
    const items = rawItems
        .map((it) => {
        const o = (it ?? {});
        return {
            id: clean(o.id, MAX_FIELD),
            name: clean(o.name, MAX_FIELD),
            repo: o.repo === true,
            demo: o.demo === true,
        };
    })
        .filter((it) => it.id && (it.repo || it.demo));
    if (items.length === 0) {
        return res.status(400).json({ error: "Select at least one project" });
    }
    if (items.some((it) => it.repo) && !github_username) {
        return res.status(400).json({ error: "GitHub username is required for repo access" });
    }
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    db_1.default.prepare(`
    INSERT INTO access_requests (id, name, email, github_username, message, projects, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(id, name, email, github_username, message, JSON.stringify(items), now);
    const asks = items
        .map((it) => `${it.name || it.id} (${[it.repo && "repo", it.demo && "demo"].filter(Boolean).join(" + ")})`)
        .join(", ");
    notifySlack(`🔑 Access request from ${name} <${email}>${github_username ? ` (gh: ${github_username})` : ""}: ${asks}` +
        (message ? `\n> ${message}` : ""));
    res.status(201).json({ ok: true });
});
// GET /api/access-requests  — internal (naukri.almari only)
router.get("/", (_req, res) => {
    const rows = db_1.default
        .prepare("SELECT * FROM access_requests ORDER BY created_at DESC")
        .all();
    res.json(rows.map((row) => ({
        ...row,
        projects: JSON.parse(row.projects || "[]"),
    })));
});
// PUT /api/access-requests/:id  { status }  — internal
router.put("/:id", (req, res) => {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }
    const result = db_1.default
        .prepare("UPDATE access_requests SET status = ? WHERE id = ?")
        .run(status, req.params.id);
    if (result.changes === 0)
        return res.status(404).json({ error: "Request not found" });
    res.json({ ok: true });
});
exports.default = router;
