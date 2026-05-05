import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import db from "../db";
import { Job, JobStatus } from "../types";

const router = Router();

const VALID_STATUSES: JobStatus[] = [
  "saved", "applying", "applied", "interview", "offer", "closed",
];

function parseJob(row: Record<string, unknown>): Job {
  return {
    ...row,
    match_reasons: JSON.parse((row.match_reasons as string) || "[]"),
    red_flags: JSON.parse((row.red_flags as string) || "[]"),
    match_score: row.match_score as number | null,
    is_default: undefined,
  } as unknown as Job;
}

// GET /api/jobs
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM jobs ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  res.json(rows.map(parseJob));
});

// GET /api/jobs/:id
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: "Job not found" });
  res.json(parseJob(row));
});

// POST /api/jobs  (manual add or scraper ingest)
router.post("/", (req: Request, res: Response) => {
  const {
    title, company, location = "", url, description = "",
    job_type = "", salary_range = "", posted_date = "",
    source = "manual", apply_type = "", apply_url = "",
    match_score = null, match_reasons = [], red_flags = [],
    recommendation = "", notes = "",
  } = req.body;

  if (!title || !company || !url) {
    return res.status(400).json({ error: "title, company, url are required" });
  }

  const now = new Date().toISOString();
  const id = req.body.id || uuid();

  db.prepare(`
    INSERT OR REPLACE INTO jobs
      (id, title, company, location, url, description, job_type, salary_range,
       posted_date, source, apply_type, apply_url, status, match_score,
       match_reasons, red_flags, recommendation, notes, found_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, title, company, location, url, description, job_type, salary_range,
    posted_date, source, apply_type, apply_url, match_score,
    JSON.stringify(match_reasons), JSON.stringify(red_flags),
    recommendation, notes, now, now,
  );

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Record<string, unknown>;
  res.status(201).json(parseJob(job));
});

// PATCH /api/jobs/:id/status
router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` });
  }

  const now = new Date().toISOString();
  const applied_at = status === "applied" ? now : null;

  db.prepare(
    "UPDATE jobs SET status = ?, applied_at = COALESCE(applied_at, ?), updated_at = ? WHERE id = ?"
  ).run(status, applied_at, now, req.params.id);

  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: "Job not found" });
  res.json(parseJob(row));
});

// PATCH /api/jobs/:id
router.patch("/:id", (req: Request, res: Response) => {
  const allowed = ["notes", "match_score", "match_reasons", "red_flags", "recommendation"];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      const val = ["match_reasons", "red_flags"].includes(field)
        ? JSON.stringify(req.body[field])
        : req.body[field];
      values.push(val);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: "No valid fields to update" });

  updates.push("updated_at = ?");
  values.push(new Date().toISOString(), req.params.id);

  db.prepare(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`).run(...(values as Parameters<typeof db.prepare>[0][]));

  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: "Job not found" });
  res.json(parseJob(row));
});

// DELETE /api/jobs/:id
router.delete("/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

export default router;
