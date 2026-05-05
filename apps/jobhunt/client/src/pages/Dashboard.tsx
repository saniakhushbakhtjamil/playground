import { useEffect, useState } from "react";
import { getStats, getHeatmap } from "../api";
import type { Stats, JobStatus, Heatmap as HeatmapData } from "../types";
import { Briefcase, TrendingUp, Star, Clock, Flame } from "lucide-react";
import { OrnamentStrip, SnowFloral } from "../components/motifs";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved", applying: "Applying", applied: "Applied",
  interview: "Interview", offer: "Offer", closed: "Closed",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [heat, setHeat] = useState<HeatmapData | null>(null);
  const t = useTheme();
  const { wallet } = useWallet();

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
    getHeatmap(98).then(setHeat).catch(console.error); // 14 weeks
  }, []);

  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const labelStyle = { ...mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: t.muted, fontWeight: 500 };
  const card = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 6 };

  const STATUS_COLORS: Record<JobStatus, string> = {
    saved: t.muted,
    applying: t.cool,
    applied: t.cool,
    interview: t.accent,
    offer: t.ok,
    closed: t.ornInk,
  };

  const statuses: JobStatus[] = ["saved", "applying", "applied", "interview", "offer", "closed"];

  if (!stats) {
    return (
      <div style={{ padding: 32, ...mono, fontSize: 12, color: t.muted }}>loading…</div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: t.bg }}>
      {/* Page header */}
      <div style={{ padding: '28px 32px 0' }}>
        <p style={{ ...mono, fontSize: 10, color: t.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
          overview
        </p>
        <h1 style={{ ...mono, fontSize: 22, fontWeight: 600, color: t.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Dashboard
        </h1>
      </div>
      <div style={{ marginTop: 16 }}>
        <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} />
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Total tracked', value: stats.total, icon: Briefcase, color: t.cool },
            { label: 'Interviews', value: stats.byStatus.interview ?? 0, icon: TrendingUp, color: t.accent },
            { label: 'Offers', value: stats.byStatus.offer ?? 0, icon: Star, color: t.ok },
            { label: 'Avg match', value: stats.avgMatchScore !== null ? `${stats.avgMatchScore}%` : '—', icon: TrendingUp, color: t.warm },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ padding: 7, borderRadius: 5, background: color + '20', flexShrink: 0 }}>
                <Icon size={15} color={color} />
              </div>
              <div>
                <p style={{ ...mono, fontSize: 26, fontWeight: 500, color: t.fg, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
                <p style={{ ...labelStyle, marginTop: 4 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <SnowFloral size={10} color={t.warm} />
            pipeline
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {statuses.map(s => (
              <div key={s} style={{ ...card, flex: 1, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s], margin: '0 auto 8px' }} />
                <p style={{ ...mono, fontSize: 22, fontWeight: 500, color: t.fg, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {stats.byStatus[s] ?? 0}
                </p>
                <p style={{ ...labelStyle, marginTop: 4, fontSize: 9 }}>{STATUS_LABELS[s]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        {heat && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SnowFloral size={10} color={t.accent} />
                activity · last {heat.days} days
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.warm, textTransform: 'none', letterSpacing: 0 }}>
                <Flame size={11} />
                <span style={{ ...mono, fontSize: 11, fontWeight: 500 }}>{wallet.streak}d streak · {wallet.multiplier}×</span>
              </span>
            </div>
            <div style={{ ...card, padding: '16px 18px' }}>
              <Heatmap data={heat} t={t} />
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div>
          <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <SnowFloral size={10} color={t.cool} />
            recent activity
          </div>
          <div style={{ ...card }}>
            {stats.recentActivity.length === 0 && (
              <p style={{ padding: '20px 18px', ...mono, fontSize: 12, color: t.muted }}>No activity yet.</p>
            )}
            {stats.recentActivity.map((job, i) => (
              <div key={job.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: i < stats.recentActivity.length - 1 ? `1px solid ${t.borderSubtle}` : 'none',
              }}>
                <div>
                  <p style={{ ...mono, fontSize: 13, fontWeight: 500, color: t.fg }}>{job.title}</p>
                  <p style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 2 }}>{job.company}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 3,
                    background: STATUS_COLORS[job.status as JobStatus] + '20',
                    color: STATUS_COLORS[job.status as JobStatus],
                  }}>
                    {STATUS_LABELS[job.status as JobStatus]}
                  </span>
                  <span style={{ ...mono, fontSize: 10, color: t.ornInk, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {new Date(job.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function Heatmap({ data, t }: { data: HeatmapData; t: ReturnType<typeof useTheme> }) {
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const cell = 11;
  const gap = 3;

  // Pad start so first column begins on Sunday
  const first = new Date(data.series[0].date + "T00:00:00");
  const padStart = first.getDay(); // 0=Sun
  const padded: ({ date: string; count: number } | null)[] =
    Array(padStart).fill(null).concat(data.series);
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (typeof padded)[] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const max = Math.max(1, ...data.series.map((d) => d.count));
  const colorFor = (count: number): string => {
    if (count === 0) return t.borderSubtle;
    const ratio = count / max;
    if (ratio > 0.75) return t.accent;       // saffron — hottest
    if (ratio > 0.5)  return t.warm;          // terracotta
    if (ratio > 0.25) return t.cool;          // teal
    return t.cool + '60';                     // faint teal
  };

  const monthLabels: { col: number; label: string }[] = [];
  weeks.forEach((w, ci) => {
    const firstReal = w.find((d) => d);
    if (!firstReal) return;
    const d = new Date(firstReal.date + "T00:00:00");
    if (d.getDate() <= 7) {
      monthLabels.push({ col: ci, label: d.toLocaleString('en', { month: 'short' }).toLowerCase() });
    }
  });

  const dayLabels = ['m', 'w', 'f'];
  const dayLabelRows = [1, 3, 5];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Day-of-week labels */}
        <div style={{ display: 'grid', gridTemplateRows: `repeat(7, ${cell}px)`, gap, paddingTop: 14 }}>
          {Array.from({ length: 7 }).map((_, r) => (
            <div key={r} style={{ ...mono, fontSize: 8, color: t.muted, height: cell, lineHeight: `${cell}px` }}>
              {dayLabelRows.includes(r) ? dayLabels[dayLabelRows.indexOf(r)] : ''}
            </div>
          ))}
        </div>
        <div>
          {/* Month labels */}
          <div style={{ position: 'relative', height: 12, marginBottom: 2 }}>
            {monthLabels.map(({ col, label }) => (
              <span key={col} style={{
                position: 'absolute', left: col * (cell + gap),
                ...mono, fontSize: 8, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: `repeat(7, ${cell}px)`, gap }}>
            {padded.map((d, i) => (
              <div
                key={i}
                title={d ? `${d.date} · ${d.count} action${d.count === 1 ? '' : 's'}` : ''}
                style={{
                  width: cell, height: cell, borderRadius: 2,
                  background: d ? colorFor(d.count) : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
        <span style={{ ...mono, fontSize: 9, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>less</span>
        {[t.borderSubtle, t.cool + '60', t.cool, t.warm, t.accent].map((c, i) => (
          <div key={i} style={{ width: cell, height: cell, borderRadius: 2, background: c }} />
        ))}
        <span style={{ ...mono, fontSize: 9, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>more</span>
      </div>
    </div>
  );
}
