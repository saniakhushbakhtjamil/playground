import { Router, Request, Response } from "express";
import db from "../db";

const router = Router();

// GET /api/stats
router.get("/", (_req: Request, res: Response) => {
  const counts = db.prepare(`
    SELECT status, COUNT(*) as count FROM jobs GROUP BY status
  `).all() as { status: string; count: number }[];

  const total = (db.prepare("SELECT COUNT(*) as n FROM jobs").get() as { n: number }).n;
  const avgScore = (db.prepare(
    "SELECT AVG(match_score) as avg FROM jobs WHERE match_score IS NOT NULL"
  ).get() as { avg: number | null }).avg;

  const recentActivity = db.prepare(`
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
router.get("/heatmap", (req: Request, res: Response) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  // Combine found_at + updated_at as activity events, dedupe by (job_id, day)
  const rows = db.prepare(`
    SELECT day, COUNT(*) AS count FROM (
      SELECT id AS job_id, substr(found_at, 1, 10) AS day FROM jobs
      WHERE substr(found_at, 1, 10) >= ?
      UNION
      SELECT id AS job_id, substr(updated_at, 1, 10) AS day FROM jobs
      WHERE substr(updated_at, 1, 10) >= ?
    )
    GROUP BY day
  `).all(sinceStr, sinceStr) as { day: string; count: number }[];

  const map = new Map(rows.map((r) => [r.day, r.count]));
  const series: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: map.get(key) ?? 0 });
  }

  res.json({ days, series });
});

export default router;
