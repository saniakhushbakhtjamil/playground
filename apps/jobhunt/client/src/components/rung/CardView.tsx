import type { CSSProperties } from 'react';
import type { Card, Suit } from '../../lib/rung/cards';
import { SUIT_SYMBOL } from '../../lib/rung/cards';
import { useTheme } from '../../context/ThemeContext';

interface CardViewProps {
  card?: Card;          // undefined = face-down
  selected?: boolean;
  playable?: boolean;
  small?: boolean;      // for opponent hands
  style?: CSSProperties;
  onClick?: () => void;
}

const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
  hearts: 'red', diamonds: 'red',
  spades: 'black', clubs: 'black',
};

export function CardView({ card, selected, playable, small, style, onClick }: CardViewProps) {
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

  const w = small ? 32 : 56;
  const h = small ? 46 : 80;
  const fontSize = small ? 9 : 13;
  const suitSize = small ? 11 : 18;

  // Face-down card
  if (!card) {
    return (
      <div style={{
        width: w, height: h, borderRadius: 5, flexShrink: 0,
        background: t.card,
        border: `1px solid ${t.border}`,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          ${t.warm}18 0px, ${t.warm}18 2px,
          transparent 2px, transparent 8px
        )`,
        ...style,
      }} />
    );
  }

  const isRed = SUIT_COLOR[card.suit] === 'red';
  const color = isRed ? t.warm : t.cool;

  return (
    <div
      onClick={playable ? onClick : undefined}
      style={{
        width: w, height: h, borderRadius: 5, flexShrink: 0,
        background: t.fg,
        border: `2px solid ${selected ? t.accent : playable ? t.border : t.borderSubtle}`,
        cursor: playable ? 'pointer' : 'default',
        transform: selected ? 'translateY(-10px)' : 'none',
        transition: 'transform 150ms, border-color 120ms, box-shadow 120ms',
        boxShadow: selected ? `0 6px 16px oklch(0 0 0 / 0.5)` : 'none',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '2px 3px' : '4px 5px',
        position: 'relative',
        opacity: playable === false ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={e => {
        if (playable) (e.currentTarget as HTMLDivElement).style.transform = selected ? 'translateY(-14px)' : 'translateY(-6px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = selected ? 'translateY(-10px)' : 'none';
      }}
    >
      {/* Top-left rank + suit */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
        <span style={{ ...mono, fontSize, fontWeight: 700, color, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: suitSize * 0.7, color, lineHeight: 1 }}>{SUIT_SYMBOL[card.suit]}</span>
      </div>
      {/* Center suit symbol */}
      {!small && (
        <span style={{ fontSize: suitSize, color, textAlign: 'center', lineHeight: 1 }}>
          {SUIT_SYMBOL[card.suit]}
        </span>
      )}
      {/* Bottom-right rank + suit (rotated) */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
        <span style={{ ...mono, fontSize, fontWeight: 700, color, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ fontSize: suitSize * 0.7, color, lineHeight: 1 }}>{SUIT_SYMBOL[card.suit]}</span>
      </div>
    </div>
  );
}
