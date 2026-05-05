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

export default router;
