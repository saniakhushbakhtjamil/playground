import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import jobsRouter from "./routes/jobs";
import documentsRouter from "./routes/documents";
import cvVersionsRouter from "./routes/cvVersions";
import statsRouter from "./routes/stats";
import walletRouter from "./routes/wallet";

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/jobs", jobsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/cv-versions", cvVersionsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/wallet", walletRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

if (IS_PROD) {
  const staticDir = path.resolve(__dirname, "../../client/dist");
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
  }
}

app.listen(PORT, () => {
  console.log(`jobhunt server running on http://localhost:${PORT}`);
});
