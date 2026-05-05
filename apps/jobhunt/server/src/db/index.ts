import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "jobhunt.sqlite");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

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

  CREATE TABLE IF NOT EXISTS wallet (
    id                 INTEGER PRIMARY KEY,
    balance            INTEGER NOT NULL DEFAULT 0,
    streak_days        INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT
  );
`);

// Ensure single wallet row exists
const _walletRow = db.prepare("SELECT id FROM wallet WHERE id = 1").get();
if (!_walletRow) {
  db.prepare("INSERT INTO wallet (id, balance, streak_days) VALUES (1, 0, 0)").run();
}

export default db;
