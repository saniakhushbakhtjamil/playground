import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import db from "../db";

const router = Router();

// GET /api/cv-versions
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM cv_versions ORDER BY is_default DESC, created_at DESC").all();
  res.json(rows);
});

// GET /api/cv-versions/:id
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM cv_versions WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "CV version not found" });
  res.json(row);
});

// POST /api/cv-versions
router.post("/", (req: Request, res: Response) => {
  const { name, content, is_default = false } = req.body;
  if (!name || !content) return res.status(400).json({ error: "name and content are required" });

  const now = new Date().toISOString();
  const id = uuid();

  if (is_default) {
    db.prepare("UPDATE cv_versions SET is_default = 0").run();
  }

  db.prepare(`
    INSERT INTO cv_versions (id, name, content, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, content, is_default ? 1 : 0, now, now);

  res.status(201).json(db.prepare("SELECT * FROM cv_versions WHERE id = ?").get(id));
});

// PATCH /api/cv-versions/:id
router.patch("/:id", (req: Request, res: Response) => {
  const { name, content, is_default } = req.body;
  const now = new Date().toISOString();

  if (is_default) {
    db.prepare("UPDATE cv_versions SET is_default = 0").run();
  }

  db.prepare(`
    UPDATE cv_versions
    SET name = COALESCE(?, name),
        content = COALESCE(?, content),
        is_default = COALESCE(?, is_default),
        updated_at = ?
    WHERE id = ?
  `).run(name ?? null, content ?? null, is_default !== undefined ? (is_default ? 1 : 0) : null, now, req.params.id);

  const row = db.prepare("SELECT * FROM cv_versions WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "CV version not found" });
  res.json(row);
});

// DELETE /api/cv-versions/:id
router.delete("/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM cv_versions WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

export default router;
