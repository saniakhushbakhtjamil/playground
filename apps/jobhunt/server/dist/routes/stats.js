"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// GET /api/stats
router.get("/", (_req, res) => {
    const counts = db_1.default.prepare(`
    SELECT status, COUNT(*) as count FROM jobs GROUP BY status
  `).all();
    const total = db_1.default.prepare("SELECT COUNT(*) as n FROM jobs").get().n;
    const avgScore = db_1.default.prepare("SELECT AVG(match_score) as avg FROM jobs WHERE match_score IS NOT NULL").get().avg;
    const recentActivity = db_1.default.prepare(`
    SELECT id, title, company, status, updated_at
    FROM jobs
    ORDER BY updated_at DESC
    LIMIT 5
  `).all();
    const byStatus = Object.fromEntries(counts.map((r) => [r.status, r.count]));
    res.json({
        total,
        byStatus,
        avgMatchScore: avgScore ? Math.round(avgScore) : null,
        recentActivity,
    });
});
// GET /api/stats/heatmap?days=90
router.get("/heatmap", (req, res) => {
    const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceStr = since.toISOString().slice(0, 10);
    // Combine found_at + updated_at as activity events, dedupe by (job_id, day)
    const rows = db_1.default.prepare(`
    SELECT day, COUNT(*) AS count FROM (
      SELECT id AS job_id, substr(found_at, 1, 10) AS day FROM jobs
      WHERE substr(found_at, 1, 10) >= ?
      UNION
      SELECT id AS job_id, substr(updated_at, 1, 10) AS day FROM jobs
      WHERE substr(updated_at, 1, 10) >= ?
    )
    GROUP BY day
  `).all(sinceStr, sinceStr);
    const map = new Map(rows.map((r) => [r.day, r.count]));
    const series = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        series.push({ date: key, count: map.get(key) ?? 0 });
    }
    res.json({ days, series });
});
exports.default = router;
