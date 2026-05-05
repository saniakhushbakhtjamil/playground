import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import db from "../db";
import { DocumentType } from "../types";

const router = Router();

const VALID_TYPES: DocumentType[] = ["cv", "cover_letter", "email", "other"];

// GET /api/documents?job_id=xxx
router.get("/", (req: Request, res: Response) => {
  const { job_id } = req.query;
  const rows = job_id
    ? db.prepare("SELECT * FROM job_documents WHERE job_id = ? ORDER BY created_at DESC").all(job_id as string)
    : db.prepare("SELECT * FROM job_documents ORDER BY created_at DESC").all();
  res.json(rows);
});

// GET /api/documents/:id
router.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM job_documents WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Document not found" });
  res.json(row);
});

// POST /api/documents
router.post("/", (req: Request, res: Response) => {
  const { job_id = null, type, title, content } = req.body;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Valid: ${VALID_TYPES.join(", ")}` });
  }
  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  const now = new Date().toISOString();
  const id = uuid();

  db.prepare(`
    INSERT INTO job_documents (id, job_id, type, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, job_id, type, title, content, now, now);

  res.status(201).json(db.prepare("SELECT * FROM job_documents WHERE id = ?").get(id));
});

// PATCH /api/documents/:id
router.patch("/:id", (req: Request, res: Response) => {
  const { title, content } = req.body;
  const now = new Date().toISOString();

  db.prepare("UPDATE job_documents SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = ? WHERE id = ?")
    .run(title ?? null, content ?? null, now, req.params.id);

  const row = db.prepare("SELECT * FROM job_documents WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Document not found" });
  res.json(row);
});

// DELETE /api/documents/:id
router.delete("/:id", (req: Request, res: Response) => {
  db.prepare("DELETE FROM job_documents WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

export default router;
