"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const VALID_STATUSES = [
    "saved", "applying", "applied", "interview", "offer", "closed",
];
function parseJob(row) {
    return {
        ...row,
        match_reasons: JSON.parse(row.match_reasons || "[]"),
        red_flags: JSON.parse(row.red_flags || "[]"),
        match_score: row.match_score,
        is_default: undefined,
    };
}
// GET /api/jobs
router.get("/", (_req, res) => {
    const rows = db_1.default.prepare("SELECT * FROM jobs ORDER BY updated_at DESC").all();
    res.json(rows.map(parseJob));
});
// GET /api/jobs/:id
router.get("/:id", (req, res) => {
    const row = db_1.default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "Job not found" });
    res.json(parseJob(row));
});
// POST /api/jobs  (manual add or scraper ingest)
router.post("/", (req, res) => {
    const { title, company, location = "", url, description = "", job_type = "", salary_range = "", posted_date = "", source = "manual", apply_type = "", apply_url = "", match_score = null, match_reasons = [], red_flags = [], recommendation = "", notes = "", } = req.body;
    if (!title || !company || !url) {
        return res.status(400).json({ error: "title, company, url are required" });
    }
    const now = new Date().toISOString();
    const id = req.body.id || (0, uuid_1.v4)();
    db_1.default.prepare(`
    INSERT OR REPLACE INTO jobs
      (id, title, company, location, url, description, job_type, salary_range,
       posted_date, source, apply_type, apply_url, status, match_score,
       match_reasons, red_flags, recommendation, notes, found_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'saved', ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, company, location, url, description, job_type, salary_range, posted_date, source, apply_type, apply_url, match_score, JSON.stringify(match_reasons), JSON.stringify(red_flags), recommendation, notes, now, now);
    const job = db_1.default.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    res.status(201).json(parseJob(job));
});
// PATCH /api/jobs/:id/status
router.patch("/:id/status", (req, res) => {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` });
    }
    const now = new Date().toISOString();
    const applied_at = status === "applied" ? now : null;
    db_1.default.prepare("UPDATE jobs SET status = ?, applied_at = COALESCE(applied_at, ?), updated_at = ? WHERE id = ?").run(status, applied_at, now, req.params.id);
    const row = db_1.default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "Job not found" });
    res.json(parseJob(row));
});
// PATCH /api/jobs/:id
router.patch("/:id", (req, res) => {
    const allowed = ["notes", "match_score", "match_reasons", "red_flags", "recommendation"];
    const updates = [];
    const values = [];
    for (const field of allowed) {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            const val = ["match_reasons", "red_flags"].includes(field)
                ? JSON.stringify(req.body[field])
                : req.body[field];
            values.push(val);
        }
    }
    if (updates.length === 0)
        return res.status(400).json({ error: "No valid fields to update" });
    updates.push("updated_at = ?");
    values.push(new Date().toISOString(), req.params.id);
    db_1.default.prepare(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const row = db_1.default.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "Job not found" });
    res.json(parseJob(row));
});
// DELETE /api/jobs/:id
router.delete("/:id", (req, res) => {
    db_1.default.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
    res.status(204).send();
});
exports.default = router;
