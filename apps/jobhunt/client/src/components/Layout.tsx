import { NavLink } from "react-router-dom";
import { LayoutDashboard, Columns3, FileText, Flame, Spade } from "lucide-react";
import { Medallion, OrnamentStrip, SnowFloral } from "./motifs";
import { useTheme, useThemeSwitcher } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";
import { THEMES } from "../lib/themes";

const huntNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/board", label: "Board", icon: Columns3 },
  { to: "/docs", label: "Docs", icon: FileText },
];

const playNav = [
  { to: "/rung", label: "Rung", icon: Spade },
];

function EarnToast() {
  const { toast } = useWallet();
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      background: t.card, border: `1px solid ${t.accent}`,
      borderRadius: 8, padding: '12px 18px',
      boxShadow: `0 4px 24px oklch(0 0 0 / 0.4)`,
      display: 'flex', flexDirection: 'column', gap: 4,
      animation: 'slideUp 200ms ease',
      minWidth: 180,
    }}>
      <p style={{ ...mono, fontSize: 18, fontWeight: 600, color: t.accent, letterSpacing: '-0.02em' }}>
        +₨{toast.earned}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {toast.breakdown.action > 0 && (
          <p style={{ ...mono, fontSize: 10, color: t.muted, letterSpacing: '0.1em' }}>
            ACTION +₨{toast.breakdown.action}
          </p>
        )}
        {toast.breakdown.checkin > 0 && (
          <p style={{ ...mono, fontSize: 10, color: t.ok, letterSpacing: '0.1em' }}>
            DAILY BONUS +₨{toast.breakdown.checkin}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const setThemeId = useThemeSwitcher();
  const { wallet } = useWallet();

  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const labelStyle = {
    ...mono, fontSize: 10, letterSpacing: '0.18em',
    textTransform: 'uppercase' as const, color: t.muted, fontWeight: 500,
  };

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, color: t.fg, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: t.barBg,
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '20px 0 0',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Medallion size={28} primary={t.warm} secondary={t.cool} accent={t.accent} stroke={1} rays={12} />
          <span style={{ ...mono, fontSize: 14, fontWeight: 600, color: t.fg, letterSpacing: '0.04em' }}>
            naukri
          </span>
        </div>

        <OrnamentStrip height={18} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} />

        {/* Nav */}
        <nav style={{ padding: '16px 10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ ...labelStyle, padding: '0 8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SnowFloral size={9} color={t.warm} />
            hunt
          </div>
          {huntNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5,
                fontSize: 12, fontWeight: 500,
                textDecoration: 'none',
                transition: 'background 120ms',
                background: isActive ? t.warm + '22' : 'transparent',
                color: isActive ? t.warm : t.muted,
                borderLeft: isActive ? `2px solid ${t.warm}` : '2px solid transparent',
                ...mono,
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}

          <div style={{ ...labelStyle, padding: '0 8px', marginTop: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SnowFloral size={9} color={t.cool} />
            play
          </div>
          {playNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5,
                fontSize: 12, fontWeight: 500,
                textDecoration: 'none',
                transition: 'background 120ms',
                background: isActive ? t.cool + '22' : 'transparent',
                color: isActive ? t.cool : t.muted,
                borderLeft: isActive ? `2px solid ${t.cool}` : '2px solid transparent',
                ...mono,
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Rupee wallet */}
        <div style={{ margin: '16px 10px 0', padding: '12px', borderRadius: 6, background: t.card, border: `1px solid ${t.border}` }}>
          <div style={{ ...labelStyle, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SnowFloral size={9} color={t.accent} />
            wallet
          </div>
          <p style={{ ...mono, fontSize: 22, fontWeight: 600, color: t.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>
            ₨{wallet.balance.toLocaleString()}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <Flame size={11} color={wallet.streak >= 3 ? t.warm : t.ornInk} />
            <span style={{ ...mono, fontSize: 10, color: wallet.streak >= 3 ? t.warm : t.muted }}>
              {wallet.streak}d streak
              {wallet.multiplier > 1 ? ` · ${wallet.multiplier}×` : ''}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Theme switcher */}
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${t.borderSubtle}` }}>
          <div style={{ ...labelStyle, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SnowFloral size={9} color={t.muted} />
            theme
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {THEMES.map(theme => (
              <button key={theme.id} title={theme.name} onClick={() => setThemeId(theme.id)}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: theme.warm,
                  border: `2px solid ${t.id === theme.id ? t.fg : 'transparent'}`,
                  outline: 'none', transition: 'border-color 120ms',
                }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>

      <EarnToast />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
