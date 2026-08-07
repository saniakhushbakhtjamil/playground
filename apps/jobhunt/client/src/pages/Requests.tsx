import { useEffect, useState } from "react";
import { KeyRound, Check, X, ExternalLink } from "lucide-react";
import { getAccessRequests, updateAccessRequest } from "../api";
import type { AccessRequest, AccessRequestStatus } from "../types";
import { useTheme } from "../context/ThemeContext";

const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

export default function Requests() {
  const t = useTheme();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAccessRequests()
      .then(setRequests)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: AccessRequestStatus) => {
    await updateAccessRequest(id, status);
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const statusColor: Record<AccessRequestStatus, string> = {
    new: t.warm,
    approved: t.ok,
    dismissed: t.muted,
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <KeyRound size={18} color={t.warm} />
        <h1 style={{ ...mono, fontSize: 20, fontWeight: 600, color: t.fg, letterSpacing: "-0.02em" }}>
          Access Requests
        </h1>
      </div>
      <p style={{ ...mono, fontSize: 11, color: t.muted, marginBottom: 24 }}>
        repo / demo requests from saniajamil.com — approve by sending a GitHub collaborator invite, then mark it here
      </p>

      {loading && (
        <p style={{ ...mono, fontSize: 12, color: t.muted }}>loading…</p>
      )}
      {!loading && requests.length === 0 && (
        <div style={{
          padding: "32px 24px", borderRadius: 8, textAlign: "center",
          background: t.card, border: `1px dashed ${t.border}`,
        }}>
          <p style={{ ...mono, fontSize: 12, color: t.muted }}>
            No requests yet — they'll show up here when someone asks for repo or demo access on your portfolio.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {requests.map((r) => (
          <div key={r.id} style={{
            background: t.card, border: `1px solid ${r.status === "new" ? t.warm + "66" : t.border}`,
            borderRadius: 8, padding: "14px 16px",
            opacity: r.status === "dismissed" ? 0.55 : 1,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ ...mono, fontSize: 14, fontWeight: 600, color: t.fg }}>{r.name}</span>
                <a href={`mailto:${r.email}`} style={{ ...mono, fontSize: 11, color: t.cool, textDecoration: "none" }}>
                  {r.email}
                </a>
                {r.github_username && (
                  <a
                    href={`https://github.com/${r.github_username}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ ...mono, fontSize: 11, color: t.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
                  >
                    @{r.github_username}<ExternalLink size={10} />
                  </a>
                )}
              </div>
              <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: statusColor[r.status] }}>
                {r.status}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {r.projects.map((p) => (
                <span key={p.id} style={{
                  ...mono, fontSize: 10.5, color: t.fg,
                  background: t.bg, border: `1px solid ${t.border}`,
                  borderRadius: 4, padding: "3px 8px",
                }}>
                  {p.name || p.id}
                  <span style={{ color: t.muted }}>
                    {" · "}{[p.repo && "repo", p.demo && "demo"].filter(Boolean).join(" + ")}
                  </span>
                </span>
              ))}
            </div>

            {r.message && (
              <p style={{ ...mono, fontSize: 11.5, color: t.muted, marginTop: 10, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                “{r.message}”
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
              <span style={{ ...mono, fontSize: 10, color: t.muted }}>
                {new Date(r.created_at).toLocaleString()}
              </span>
              {r.status === "new" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setStatus(r.id, "approved")} style={{
                    ...mono, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    color: t.ok, background: "transparent",
                    border: `1px solid ${t.ok}`, borderRadius: 5, padding: "5px 12px",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    <Check size={12} /> mark approved
                  </button>
                  <button onClick={() => setStatus(r.id, "dismissed")} style={{
                    ...mono, fontSize: 11, cursor: "pointer",
                    color: t.muted, background: "transparent",
                    border: `1px solid ${t.border}`, borderRadius: 5, padding: "5px 12px",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    <X size={12} /> dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
