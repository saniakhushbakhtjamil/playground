"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// GET /api/cv-versions
router.get("/", (_req, res) => {
    const rows = db_1.default.prepare("SELECT * FROM cv_versions ORDER BY is_default DESC, created_at DESC").all();
    res.json(rows);
});
// GET /api/cv-versions/:id
router.get("/:id", (req, res) => {
    const row = db_1.default.prepare("SELECT * FROM cv_versions WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "CV version not found" });
    res.json(row);
});
// POST /api/cv-versions
router.post("/", (req, res) => {
    const { name, content, is_default = false } = req.body;
    if (!name || !content)
        return res.status(400).json({ error: "name and content are required" });
    const now = new Date().toISOString();
    const id = (0, uuid_1.v4)();
    if (is_default) {
        db_1.default.prepare("UPDATE cv_versions SET is_default = 0").run();
    }
    db_1.default.prepare(`
    INSERT INTO cv_versions (id, name, content, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, content, is_default ? 1 : 0, now, now);
    res.status(201).json(db_1.default.prepare("SELECT * FROM cv_versions WHERE id = ?").get(id));
});
// PATCH /api/cv-versions/:id
router.patch("/:id", (req, res) => {
    const { name, content, is_default } = req.body;
    const now = new Date().toISOString();
    if (is_default) {
        db_1.default.prepare("UPDATE cv_versions SET is_default = 0").run();
    }
    db_1.default.prepare(`
    UPDATE cv_versions
    SET name = COALESCE(?, name),
        content = COALESCE(?, content),
        is_default = COALESCE(?, is_default),
        updated_at = ?
    WHERE id = ?
  `).run(name ?? null, content ?? null, is_default !== undefined ? (is_default ? 1 : 0) : null, now, req.params.id);
    const row = db_1.default.prepare("SELECT * FROM cv_versions WHERE id = ?").get(req.params.id);
    if (!row)
        return res.status(404).json({ error: "CV version not found" });
    res.json(row);
});
// DELETE /api/cv-versions/:id
router.delete("/:id", (req, res) => {
    db_1.default.prepare("DELETE FROM cv_versions WHERE id = ?").run(req.params.id);
    res.status(204).send();
});
exports.default = router;
