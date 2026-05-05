"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const documents_1 = __importDefault(require("./routes/documents"));
const cvVersions_1 = __importDefault(require("./routes/cvVersions"));
const stats_1 = __importDefault(require("./routes/stats"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use("/api/jobs", jobs_1.default);
app.use("/api/documents", documents_1.default);
app.use("/api/cv-versions", cvVersions_1.default);
app.use("/api/stats", stats_1.default);
app.get("/health", (_req, res) => res.json({ ok: true }));
if (IS_PROD) {
    const staticDir = path_1.default.resolve(__dirname, "../../client/dist");
    if (fs_1.default.existsSync(staticDir)) {
        app.use(express_1.default.static(staticDir));
        app.get("*", (_req, res) => res.sendFile(path_1.default.join(staticDir, "index.html")));
    }
}
app.listen(PORT, () => {
    console.log(`jobhunt server running on http://localhost:${PORT}`);
});
