"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const VALID_TYPES = ["cv", "cover_letter", "email", "other"];
// GET /api/documents?job_id=xxx
router.get("/", (req, res) => {
    const { job_id } = req.query;
    const rows = job_id
        ? db_1.default.prepare("SELECT * FROM job_documents WHERE job_id = ? ORDER BY created_at DESC").all(job_id)
        : db_1.default.prepare("SELECT * FROM job_documents ORDER BY created_at DESC").all();
    res.json(rows);
});
// GET /api/documents/:id
router.get("/:id", (req, res) => {
    const row = db_1.default.prepare("SELECT * FROM job_documents WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "Document not found" });
    res.json(row);
});
// POST /api/documents
router.post("/", (req, res) => {
    const { job_id = null, type, title, content } = req.body;
    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Valid: ${VALID_TYPES.join(", ")}` });
    }
    if (!title || !content) {
        return res.status(400).json({ error: "title and content are required" });
    }
    const now = new Date().toISOString();
    const id = (0, uuid_1.v4)();
    db_1.default.prepare(`
    INSERT INTO job_documents (id, job_id, type, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, job_id, type, title, content, now, now);
    res.status(201).json(db_1.default.prepare("SELECT * FROM job_documents WHERE id = ?").get(id));
});
// PATCH /api/documents/:id
router.patch("/:id", (req, res) => {
    const { title, content } = req.body;
    const now = new Date().toISOString();
    db_1.default.prepare("UPDATE job_documents SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = ? WHERE id = ?")
        .run(title ?? null, content ?? null, now, req.params.id);
    const row = db_1.default.prepare("SELECT * FROM job_documents WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "Document not found" });
    res.json(row);
});
// DELETE /api/documents/:id
router.delete("/:id", (req, res) => {
    db_1.default.prepare("DELETE FROM job_documents WHERE id = ?").run(req.params.id);
    res.status(204).send();
});
exports.default = router;
