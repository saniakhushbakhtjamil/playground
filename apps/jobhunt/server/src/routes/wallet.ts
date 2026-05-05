import { Router, Request, Response } from "express";
import db from "../db";

const router = Router();

interface WalletRow {
  id: number;
  balance: number;
  streak_days: number;
  last_activity_date: string | null;
}

const EARN = {
  job_saved:        10,
  status_advanced:  15,
  reached_interview: 50,
  got_offer:        200,
  daily_checkin:    25,
} as const;

type EarnAction = keyof typeof EARN;

function streakMultiplier(days: number): number {
  if (days >= 7) return 2;
  if (days >= 3) return 1.5;
  return 1;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function updateStreak(wallet: WalletRow): { streak: number; multiplier: number; checkinEarned: boolean } {
  const today = todayStr();
  const last = wallet.last_activity_date;

  if (last === today) {
    // Already active today — no checkin bonus, just keep streak
    return { streak: wallet.streak_days, multiplier: streakMultiplier(wallet.streak_days), checkinEarned: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = last === yesterdayStr ? wallet.streak_days + 1 : 1;
  return { streak: newStreak, multiplier: streakMultiplier(newStreak), checkinEarned: true };
}

// GET /api/wallet
router.get("/", (_req: Request, res: Response) => {
  const wallet = db.prepare("SELECT * FROM wallet WHERE id = 1").get() as unknown as WalletRow;
  const { streak, multiplier } = updateStreak(wallet);
  res.json({ balance: wallet.balance, streak, multiplier });
});

// POST /api/wallet/earn  { action: EarnAction }
router.post("/earn", (req: Request, res: Response) => {
  const { action } = req.body as { action: EarnAction };
  if (!EARN[action]) {
    res.status(400).json({ error: "Unknown action" });
    return;
  }

  const wallet = db.prepare("SELECT * FROM wallet WHERE id = 1").get() as unknown as WalletRow;
  const { streak, multiplier, checkinEarned } = updateStreak(wallet);

  // Base earn for the action
  let earned = EARN[action];
  // Daily checkin bonus if first action of the day
  let checkinBonus = 0;
  if (checkinEarned) {
    checkinBonus = Math.round(EARN.daily_checkin * multiplier);
  }

  const total = earned + checkinBonus;
  const newBalance = wallet.balance + total;

  db.prepare(`
    UPDATE wallet SET
      balance = ?,
      streak_days = ?,
      last_activity_date = ?
    WHERE id = 1
  `).run(newBalance, streak, todayStr());

  res.json({
    earned: total,
    breakdown: { action: earned, checkin: checkinBonus },
    balance: newBalance,
    streak,
    multiplier,
  });
});

// POST /api/wallet/rung  { bet: number, won: boolean }
router.post("/rung", (req: Request, res: Response) => {
  const { bet, won } = req.body as { bet: number; won: boolean };
  if (typeof bet !== "number" || bet <= 0) {
    res.status(400).json({ error: "Invalid bet" });
    return;
  }

  const wallet = db.prepare("SELECT * FROM wallet WHERE id = 1").get() as unknown as WalletRow;
  const delta = won ? bet : -bet;
  const newBalance = Math.max(0, wallet.balance + delta);

  db.prepare("UPDATE wallet SET balance = ? WHERE id = 1").run(newBalance);

  res.json({ balance: newBalance, delta });
});

export default router;
