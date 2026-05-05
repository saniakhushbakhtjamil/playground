"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_sqlite_1 = require("node:sqlite");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_DIR = path_1.default.resolve(__dirname, "../../data");
const DB_PATH = path_1.default.join(DB_DIR, "jobhunt.sqlite");
if (!fs_1.default.existsSync(DB_DIR)) {
    fs_1.default.mkdirSync(DB_DIR, { recursive: true });
}
const db = new node_sqlite_1.DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    company       TEXT NOT NULL,
    location      TEXT DEFAULT '',
    url           TEXT NOT NULL,
    description   TEXT DEFAULT '',
    job_type      TEXT DEFAULT '',
    salary_range  TEXT DEFAULT '',
    posted_date   TEXT DEFAULT '',
    source        TEXT DEFAULT '',
    apply_type    TEXT DEFAULT '',
    apply_url     TEXT DEFAULT '',
    status        TEXT DEFAULT 'saved',
    match_score   INTEGER,
    match_reasons TEXT DEFAULT '[]',
    red_flags     TEXT DEFAULT '[]',
    recommendation TEXT DEFAULT '',
    notes         TEXT DEFAULT '',
    applied_at    TEXT,
    found_at      TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_documents (
    id         TEXT PRIMARY KEY,
    job_id     TEXT REFERENCES jobs(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cv_versions (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    content    TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
exports.default = db;
