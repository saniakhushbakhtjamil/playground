import { useEffect, useState } from "react";
import { getJobs, updateJobStatus, deleteJob, createJob } from "../api";
import type { Job, JobStatus } from "../types";
import { Plus, ExternalLink, Trash2, ChevronRight, ChevronLeft, X } from "lucide-react";
import { OrnamentStrip, SnowFloral } from "../components/motifs";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";

const STATUS_ORDER: JobStatus[] = ["saved", "applying", "applied", "interview", "offer", "closed"];
const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved", applying: "Applying", applied: "Applied",
  interview: "Interview", offer: "Offer", closed: "Closed",
};

function useStatusColors() {
  const t = useTheme();
  return {
    saved:     t.muted,
    applying:  t.cool,
    applied:   t.cool,
    interview: t.accent,
    offer:     t.ok,
    closed:    t.ornInk,
  } as Record<JobStatus, string>;
}

function JobCard({ job, onMove, onDelete }: {
  job: Job;
  onMove: (id: string, dir: "left" | "right") => void;
  onDelete: (id: string) => void;
}) {
  const t = useTheme();
  const colors = useStatusColors();
  const [hovered, setHovered] = useState(false);
  const idx = STATUS_ORDER.indexOf(job.status);
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.card,
        border: `1px solid ${hovered ? t.border : t.borderSubtle}`,
        borderRadius: 5, padding: '10px 12px',
        transition: 'border-color 120ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...mono, fontSize: 12, fontWeight: 500, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.title}
          </p>
          <p style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.company}
          </p>
          {job.location && (
            <p style={{ ...mono, fontSize: 10, color: t.ornInk, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.location}
            </p>
          )}
        </div>
        <a href={job.url} target="_blank" rel="noreferrer"
          style={{ flexShrink: 0, color: t.ornInk, transition: 'color 120ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = t.warm)}
          onMouseLeave={e => (e.currentTarget.style.color = t.ornInk)}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {job.match_score !== null && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 3, background: t.borderSubtle, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${job.match_score}%`, height: '100%', background: colors[job.status], borderRadius: 2 }} />
          </div>
          <span style={{ ...mono, fontSize: 10, color: t.muted }}>{job.match_score}%</span>
        </div>
      )}

      <div style={{
        marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        opacity: hovered ? 1 : 0, transition: 'opacity 120ms',
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { dir: 'left' as const, icon: ChevronLeft, disabled: idx === 0 },
            { dir: 'right' as const, icon: ChevronRight, disabled: idx === STATUS_ORDER.length - 1 },
          ].map(({ dir, icon: Icon, disabled }) => (
            <button key={dir} onClick={() => onMove(job.id, dir)} disabled={disabled}
              style={{
                padding: 3, borderRadius: 3, border: 'none', background: 'transparent',
                color: disabled ? t.borderSubtle : t.muted, cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'color 120ms, background 120ms',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = t.fg; }}
              onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = t.muted; }}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
        <button onClick={() => onDelete(job.id)}
          style={{ padding: 3, borderRadius: 3, border: 'none', background: 'transparent', color: t.ornInk, transition: 'color 120ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = t.warm)}
          onMouseLeave={e => (e.currentTarget.style.color = t.ornInk)}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function AddJobModal({ onClose, onAdd }: { onClose: () => void; onAdd: (job: Job) => void }) {
  const t = useTheme();
  const { earn } = useWallet();
  const [form, setForm] = useState({ title: "", company: "", url: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const labelStyle = { ...mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: t.muted, display: 'block', marginBottom: 5 };
  const inputStyle = {
    width: '100%', background: t.bg, border: `1px solid ${t.border}`,
    borderRadius: 4, padding: '7px 10px', ...mono, fontSize: 12, color: t.fg, outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const job = await createJob(form);
      onAdd(job);
      earn("job_saved");
      onClose();
    }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${t.borderSubtle}` }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: t.fg }}>Add Job</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.muted, padding: 2 }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(["title", "company", "url", "location", "notes"] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field}</label>
              {field === "notes" ? (
                <textarea rows={3} value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              ) : (
                <input required={["title", "company", "url"].includes(field)}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = t.warm)}
                  onBlur={e => (e.target.style.borderColor = t.border)}
                />
              )}
            </div>
          ))}
          <button type="submit" disabled={saving}
            style={{
              background: t.warm, color: t.bg, border: 'none',
              borderRadius: 4, padding: '9px 0', ...mono, fontSize: 12, fontWeight: 600,
              opacity: saving ? 0.6 : 1, transition: 'opacity 120ms',
            }}
          >
            {saving ? "saving…" : "Add Job"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Board() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const t = useTheme();
  const colors = useStatusColors();
  const { earn } = useWallet();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const labelStyle = { ...mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: t.muted, fontWeight: 500 };

  useEffect(() => { getJobs().then(setJobs).catch(console.error); }, []);

  const handleMove = async (id: string, direction: "left" | "right") => {
    const job = jobs.find(j => j.id === id)!;
    const idx = STATUS_ORDER.indexOf(job.status);
    const newStatus = STATUS_ORDER[direction === "right" ? idx + 1 : idx - 1];
    const updated = await updateJobStatus(id, newStatus);
    setJobs(prev => prev.map(j => j.id === id ? updated : j));
    // Award rupees for advancing
    if (direction === "right") {
      if (newStatus === "interview") earn("reached_interview");
      else if (newStatus === "offer") earn("got_offer");
      else earn("status_advanced");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div style={{ minHeight: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SnowFloral size={9} color={t.warm} />
              kanban
            </p>
            <h1 style={{ ...mono, fontSize: 22, fontWeight: 600, color: t.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Board
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 2 }}>
            <span style={{ ...labelStyle }}>{jobs.length} jobs</span>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: t.warm, color: t.bg, border: 'none',
                borderRadius: 4, padding: '7px 12px', ...mono, fontSize: 11, fontWeight: 600,
              }}
            >
              <Plus size={13} />
              Add Job
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} />
      </div>

      {/* Columns */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: '20px 24px', overflowX: 'auto' }}>
        {STATUS_ORDER.map(status => {
          const col = jobs.filter(j => j.status === status);
          const color = colors[status];
          return (
            <div key={status} style={{ display: 'flex', flexDirection: 'column', width: 210, flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `2px solid ${color}`,
              }}>
                <span style={{ ...labelStyle, color, fontSize: 10 }}>{STATUS_LABELS[status]}</span>
                <span style={{ ...labelStyle, fontSize: 9 }}>{col.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {col.map(job => (
                  <JobCard key={job.id} job={job} onMove={handleMove} onDelete={handleDelete} />
                ))}
                {col.length === 0 && (
                  <p style={{ ...mono, fontSize: 10, color: t.ornInk, textAlign: 'center', padding: '20px 0' }}>—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddJobModal onClose={() => setShowAdd(false)} onAdd={job => setJobs(prev => [job, ...prev])} />
      )}
    </div>
  );
}
