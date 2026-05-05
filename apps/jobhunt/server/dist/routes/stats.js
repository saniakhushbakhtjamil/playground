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
exports.default = router;
