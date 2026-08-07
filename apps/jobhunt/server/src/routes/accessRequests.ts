import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import db from "../db";

const router = Router();

interface RequestItem {
  id: string;
  name: string;
  repo: boolean;
  demo: boolean;
}

const VALID_STATUSES = ["new", "approved", "dismissed"];
const MAX_FIELD = 200;
const MAX_MESSAGE = 1000;
const MAX_ITEMS = 20;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function notifySlack(text: string): void {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch((err) => console.error("slack notify failed:", err));
}

// POST /api/access-requests  — public (proxied through the portfolio nginx)
router.post("/", (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  // Honeypot: bots fill every field. Pretend success, store nothing.
  if (clean(body.website, MAX_FIELD)) {
    return res.json({ ok: true });
  }

  const name = clean(body.name, MAX_FIELD);
  const email = clean(body.email, MAX_FIELD);
  const github_username = clean(body.github_username, MAX_FIELD).replace(/^@/, "");
  const message = clean(body.message, MAX_MESSAGE);

  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const items = rawItems
    .map((it): RequestItem => {
      const o = (it ?? {}) as Record<string, unknown>;
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

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO access_requests (id, name, email, github_username, message, projects, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(id, name, email, github_username, message, JSON.stringify(items), now);

  const asks = items
    .map((it) => `${it.name || it.id} (${[it.repo && "repo", it.demo && "demo"].filter(Boolean).join(" + ")})`)
    .join(", ");
  notifySlack(
    `🔑 Access request from ${name} <${email}>${github_username ? ` (gh: ${github_username})` : ""}: ${asks}` +
    (message ? `\n> ${message}` : "")
  );

  res.status(201).json({ ok: true });
});

// GET /api/access-requests  — internal (naukri.almari only)
router.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM access_requests ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  res.json(rows.map((row) => ({
    ...row,
    projects: JSON.parse((row.projects as string) || "[]"),
  })));
});

// PUT /api/access-requests/:id  { status }  — internal
router.put("/:id", (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const result = db
    .prepare("UPDATE access_requests SET status = ? WHERE id = ?")
    .run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Request not found" });
  res.json({ ok: true });
});

export default router;
