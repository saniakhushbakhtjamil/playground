import type { CSSProperties } from 'react';

interface MedallionProps {
  size?: number;
  primary?: string;
  secondary?: string;
  accent?: string;
  stroke?: number;
  rays?: number;
  style?: CSSProperties;
}

export function Medallion({ size = 96, primary = 'currentColor', secondary, accent, stroke = 1.25, rays = 16, style }: MedallionProps) {
  const c = size / 2;
  const r1 = size * 0.46;
  const r2 = size * 0.36;
  const r3 = size * 0.22;
  const r4 = size * 0.10;
  const sec = secondary ?? primary;
  const acc = accent ?? primary;

  const petals = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    return (
      <line key={i}
        x1={c + Math.cos(a) * r2} y1={c + Math.sin(a) * r2}
        x2={c + Math.cos(a) * r1} y2={c + Math.sin(a) * r1}
        stroke={sec} strokeWidth={stroke} strokeLinecap="round"
      />
    );
  });

  const dots = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return <circle key={i} cx={c + Math.cos(a) * r3} cy={c + Math.sin(a) * r3} r={stroke * 0.9} fill={acc} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      <circle cx={c} cy={c} r={r1} fill="none" stroke={primary} strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r2} fill="none" stroke={primary} strokeWidth={stroke} />
      {petals}
      <circle cx={c} cy={c} r={r3} fill="none" stroke={primary} strokeWidth={stroke} />
      {dots}
      <circle cx={c} cy={c} r={r4} fill={acc} />
      <circle cx={c} cy={c} r={r4 * 0.4} fill={primary === acc ? sec : primary} />
    </svg>
  );
}

interface OrnamentStripProps {
  height?: number;
  palette?: { ink?: string; warm?: string; cool?: string; accent?: string };
  style?: CSSProperties;
}

export function OrnamentStrip({ height = 28, palette = {}, style }: OrnamentStripProps) {
  const { ink = '#0c0c0c', warm = '#C84B3D', cool = '#1F8A8A', accent = '#E5A93A' } = palette;
  const width = 1200;
  const tw = width / 80;
  const dtw = width / 60;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', ...style }}>
      <rect x="0" y="0" width={width} height="2" fill={ink} />
      <g transform="translate(0,3)">
        {Array.from({ length: 80 }, (_, i) => (
          <polygon key={i}
            points={`${i * tw},6 ${i * tw + tw / 2},0 ${i * tw + tw},6`}
            fill={i % 2 === 0 ? warm : cool}
          />
        ))}
      </g>
      <rect x="0" y="10" width={width} height="1" fill={ink} opacity="0.4" />
      <g transform={`translate(0,${height - 14})`}>
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={(i + 0.5) * dtw} cy="2"
            r={i % 3 === 0 ? 1.6 : 0.8}
            fill={i % 5 === 0 ? accent : ink}
          />
        ))}
      </g>
      <g transform={`translate(0,${height - 8})`}>
        {Array.from({ length: 80 }, (_, i) => (
          <polygon key={i}
            points={`${i * tw},0 ${i * tw + tw / 2},6 ${i * tw + tw},0`}
            fill={i % 2 === 0 ? cool : warm}
          />
        ))}
      </g>
      <rect x="0" y={height - 2} width={width} height="2" fill={ink} />
    </svg>
  );
}

interface SnowFloralProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function SnowFloral({ size = 16, color = 'currentColor', style }: SnowFloralProps) {
  const c = size / 2;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = c + Math.cos(a) * size * 0.4;
    const y = c + Math.sin(a) * size * 0.4;
    items.push(<line key={`l${i}`} x1={c} y1={c} x2={x} y2={y} stroke={color} strokeWidth="0.8" />);
    items.push(<circle key={`d${i}`} cx={x} cy={y} r={size * 0.07} fill={color} />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      {items}
      <circle cx={c} cy={c} r={size * 0.12} fill={color} />
    </svg>
  );
}

interface TriangleBandProps {
  height?: number;
  color?: string;
  count?: number;
  flip?: boolean;
  style?: CSSProperties;
}

export function TriangleBand({ height = 18, color = 'currentColor', count = 40, flip = false, style }: TriangleBandProps) {
  const width = 1200;
  const tw = width / count;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={style}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = i * tw;
        const pts = flip
          ? `${x0},${height} ${x0 + tw / 2},0 ${x0 + tw},${height}`
          : `${x0},0 ${x0 + tw / 2},${height} ${x0 + tw},0`;
        return (
          <polygon key={i} points={pts}
            fill={i % 2 === 0 ? color : 'transparent'}
            stroke={color} strokeWidth="0.75"
          />
        );
      })}
    </svg>
  );
}
