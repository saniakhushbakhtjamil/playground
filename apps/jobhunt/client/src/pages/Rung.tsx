import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { OrnamentStrip, SnowFloral, Medallion } from '../components/motifs';
import { CardView } from '../components/rung/CardView';
import type { Suit, Card } from '../lib/rung/cards';
import { SUIT_SYMBOL, SUIT_LABEL, sortHand, SUITS } from '../lib/rung/cards';
import {
  initGame, callRung, playCard, nextTrick,
  yourTeamWon, rupeeResult, teamTricks,
  YOUR_TEAM, OPP_TEAM, PLAYER_NAMES,
} from '../lib/rung/engine';
import type { GameState, PlayerIndex } from '../lib/rung/engine';
import { aiChooseCard } from '../lib/rung/ai';

const BET_OPTIONS = [25, 50, 100, 200];
const AI_DELAY = 700; // ms between AI moves

// ── Reducer ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'START'; bet: number }
  | { type: 'RESET' }
  | { type: 'CALL_RUNG'; trump: Suit }
  | { type: 'PLAY'; player: PlayerIndex; card: Card }
  | { type: 'NEXT_TRICK' };

function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === 'START') return initGame(action.bet);
  if (action.type === 'RESET') return null;
  if (!state) return state;
  if (action.type === 'CALL_RUNG') return callRung(state, action.trump);
  if (action.type === 'PLAY') return playCard(state, action.player, action.card);
  if (action.type === 'NEXT_TRICK') return nextTrick(state);
  return state;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RungPage() {
  const { wallet, settle } = useWallet();
  const [game, dispatch] = useReducer(reducer, null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── AI auto-play ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!game || game.phase !== 'playing') return;
    if (game.currentPlayer === 0) return; // Human's turn

    aiTimer.current = setTimeout(() => {
      const card = aiChooseCard(game, game.currentPlayer);
      dispatch({ type: 'PLAY', player: game.currentPlayer, card });
    }, AI_DELAY);

    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [game?.phase, game?.currentPlayer, game?.currentTrick.length]);

  // ── Auto-advance trick_end ────────────────────────────────────────────────
  useEffect(() => {
    if (!game || game.phase !== 'trick_end') return;
    const t2 = setTimeout(() => dispatch({ type: 'NEXT_TRICK' }), 1200);
    return () => clearTimeout(t2);
  }, [game?.phase, game?.trickHistory.length]);

  // ── Wallet update on game over ────────────────────────────────────────────
  const settled = useRef(false);
  useEffect(() => {
    if (!game || game.phase !== 'game_over' || settled.current) return;
    settled.current = true;
    const won = yourTeamWon(game);
    settle(game.bet, won);
  }, [game?.phase]);

  const startGame = useCallback((bet: number) => {
    settled.current = false;
    dispatch({ type: 'START', bet });
  }, []);

  const resetGame = useCallback(() => {
    settled.current = false;
    dispatch({ type: 'RESET' });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  // BET screen
  if (!game || game.phase === 'bet') {
    return <BetScreen wallet={wallet} onBet={startGame} />;
  }

  // CALL RUNG screen
  if (game.phase === 'call_rung') {
    return (
      <CallRungScreen
        game={game}
        onCallRung={(trump) => dispatch({ type: 'CALL_RUNG', trump })}
      />
    );
  }

  // GAME OVER screen
  if (game.phase === 'game_over') {
    return (
      <ResultScreen
        game={game}
        onPlayAgain={() => startGame(game.bet)}
        onChangeBet={resetGame}
      />
    );
  }

  // PLAYING / TRICK_END
  return (
    <PlayScreen
      game={game}
      onPlayCard={(card) => dispatch({ type: 'PLAY', player: 0, card })}
    />
  );
}

// ── Bet Screen ────────────────────────────────────────────────────────────────
function BetScreen({ wallet, onBet }: { wallet: { balance: number; streak: number; multiplier: number }; onBet: (bet: number) => void }) {
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const label = { ...mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: t.muted };

  return (
    <div style={{ minHeight: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 32px 0' }}>
        <p style={{ ...label, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SnowFloral size={9} color={t.warm} /> card room
        </p>
        <h1 style={{ ...mono, fontSize: 22, fontWeight: 600, color: t.fg, letterSpacing: '-0.02em' }}>Rung</h1>
      </div>
      <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} style={{ marginTop: 16 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <Medallion size={72} primary={t.warm} secondary={t.cool} accent={t.accent} stroke={1.5} rays={16} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: 13, color: t.fg, marginBottom: 4 }}>Place your bet</p>
          <p style={{ ...mono, fontSize: 11, color: t.muted }}>Balance: ₨{wallet.balance.toLocaleString()}</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {BET_OPTIONS.map(amount => (
            <button
              key={amount}
              disabled={wallet.balance < amount}
              onClick={() => onBet(amount)}
              style={{
                ...mono, fontSize: 14, fontWeight: 600,
                padding: '14px 22px', borderRadius: 6,
                border: `1px solid ${t.border}`,
                background: t.card, color: wallet.balance >= amount ? t.accent : t.ornInk,
                cursor: wallet.balance >= amount ? 'pointer' : 'not-allowed',
                transition: 'border-color 120ms, background 120ms',
              }}
              onMouseEnter={e => { if (wallet.balance >= amount) { (e.currentTarget as HTMLButtonElement).style.borderColor = t.accent; (e.currentTarget as HTMLButtonElement).style.background = t.accent + '18'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; (e.currentTarget as HTMLButtonElement).style.background = t.card; }}
            >
              ₨{amount}
            </button>
          ))}
        </div>

        <p style={{ ...mono, fontSize: 10, color: t.ornInk }}>Win → double · Lose → gone</p>
      </div>
    </div>
  );
}

// ── Call Rung Screen ──────────────────────────────────────────────────────────
function CallRungScreen({ game, onCallRung }: { game: GameState; onCallRung: (s: Suit) => void }) {
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

  const suitCounts: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  for (const c of game.hands[0]) suitCounts[c.suit]++;

  const SUIT_COLORS: Record<Suit, string> = {
    hearts: t.warm, diamonds: t.warm, spades: t.cool, clubs: t.cool,
  };

  return (
    <div style={{ minHeight: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 32px 0' }}>
        <p style={{ ...mono, fontSize: 10, color: t.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>your hand</p>
        <h1 style={{ ...mono, fontSize: 22, fontWeight: 600, color: t.fg, letterSpacing: '-0.02em' }}>Call Rung</h1>
      </div>
      <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} style={{ marginTop: 16 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        {/* Your hand */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700, padding: '0 16px' }}>
          {game.hands[0].map(card => (
            <CardView key={card.id} card={card} />
          ))}
        </div>

        <p style={{ ...mono, fontSize: 12, color: t.muted }}>Pick the trump suit (rung)</p>

        {/* Suit picker */}
        <div style={{ display: 'flex', gap: 12 }}>
          {SUITS.map(suit => (
            <button key={suit} onClick={() => onCallRung(suit)}
              style={{
                ...mono, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '16px 20px', borderRadius: 6,
                border: `1px solid ${t.border}`, background: t.card,
                color: SUIT_COLORS[suit], cursor: 'pointer',
                transition: 'border-color 120ms, background 120ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = SUIT_COLORS[suit]; (e.currentTarget as HTMLButtonElement).style.background = SUIT_COLORS[suit] + '18'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; (e.currentTarget as HTMLButtonElement).style.background = t.card; }}
            >
              <span style={{ fontSize: 28 }}>{SUIT_SYMBOL[suit]}</span>
              <span style={{ fontSize: 11, color: t.fg }}>{SUIT_LABEL[suit]}</span>
              <span style={{ fontSize: 10, color: t.muted }}>{suitCounts[suit]} cards</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Play Screen ───────────────────────────────────────────────────────────────
function PlayScreen({ game, onPlayCard }: { game: GameState; onPlayCard: (card: Card) => void }) {
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;

  const yourTurn = game.currentPlayer === 0 && game.phase === 'playing';
  const yourTricks = teamTricks(game, YOUR_TEAM);
  const oppTricks = teamTricks(game, OPP_TEAM);
  const tricksPlayed = game.trickHistory.length;

  // Which cards are playable for human
  const playableIds = new Set<string>();
  if (yourTurn) {
    const ledSuit = game.ledSuit;
    const hand = game.hands[0];
    if (!ledSuit) {
      hand.forEach(c => playableIds.add(c.id));
    } else {
      const inSuit = hand.filter(c => c.suit === ledSuit);
      if (inSuit.length > 0) inSuit.forEach(c => playableIds.add(c.id));
      else hand.forEach(c => playableIds.add(c.id));
    }
  }

  // Sort your hand with trump first
  const yourHand = sortHand(game.hands[0], game.trump);

  const posStyle = (top: string, left: string): React.CSSProperties => ({
    position: 'absolute', top, left, transform: 'translate(-50%, -50%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{ minHeight: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ ...mono, fontSize: 11, color: t.muted }}>
            Trump: <span style={{ color: t.accent, fontSize: 16 }}>{game.trump ? SUIT_SYMBOL[game.trump] : '—'}</span>
            <span style={{ color: t.muted, marginLeft: 4 }}>{game.trump ? SUIT_LABEL[game.trump] : ''}</span>
          </div>
          <div style={{ ...mono, fontSize: 11, color: t.muted }}>Trick {tricksPlayed + 1}/13</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: 18, fontWeight: 600, color: t.ok }}>{yourTricks}</p>
            <p style={{ ...mono, fontSize: 9, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your team</p>
          </div>
          <div style={{ ...mono, fontSize: 18, fontWeight: 300, color: t.ornInk, alignSelf: 'center' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: 18, fontWeight: 600, color: t.warm }}>{oppTricks}</p>
            <p style={{ ...mono, fontSize: 9, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Opponents</p>
          </div>
        </div>
      </div>

      <OrnamentStrip height={18} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} style={{ marginTop: 10 }} />

      {/* Table */}
      <div style={{ flex: 1, position: 'relative', minHeight: 280 }}>

        {/* Bot-Partner (top) */}
        <div style={{ ...posStyle('18%', '50%'), gap: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <p style={{ ...mono, fontSize: 9, color: game.currentPlayer === 2 ? t.ok : t.ornInk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {game.currentPlayer === 2 ? '▼ ' : ''}{PLAYER_NAMES[2]}
            </p>
            <div style={{ display: 'flex', gap: 2 }}>
              {game.hands[2].map((_, i) => <CardView key={i} small style={{ width: 24, height: 34 }} />)}
            </div>
          </div>
        </div>

        {/* Bot-Left (left) */}
        <div style={{ ...posStyle('50%', '16%') }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <p style={{ ...mono, fontSize: 9, color: game.currentPlayer === 1 ? t.warm : t.ornInk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {PLAYER_NAMES[1]}{game.currentPlayer === 1 ? ' ▶' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {game.hands[1].map((_, i) => <CardView key={i} small style={{ width: 24, height: 34 }} />)}
            </div>
          </div>
        </div>

        {/* Bot-Right (right) */}
        <div style={{ ...posStyle('50%', '84%') }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <p style={{ ...mono, fontSize: 9, color: game.currentPlayer === 3 ? t.warm : t.ornInk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {game.currentPlayer === 3 ? '◀ ' : ''}{PLAYER_NAMES[3]}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {game.hands[3].map((_, i) => <CardView key={i} small style={{ width: 24, height: 34 }} />)}
            </div>
          </div>
        </div>

        {/* Current trick — center */}
        <div style={{ ...posStyle('50%', '50%'), gap: 8, flexWrap: 'wrap', maxWidth: 240, justifyContent: 'center' }}>
          {game.currentTrick.map(({ player, card }) => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ ...mono, fontSize: 8, color: t.ornInk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{PLAYER_NAMES[player]}</span>
              <CardView card={card} />
            </div>
          ))}
          {game.currentTrick.length === 0 && game.phase === 'playing' && (
            <p style={{ ...mono, fontSize: 10, color: t.ornInk }}>
              {yourTurn ? 'your turn' : `${PLAYER_NAMES[game.currentPlayer]} thinking…`}
            </p>
          )}
          {game.phase === 'trick_end' && game.trickWinner !== null && (
            <p style={{ ...mono, fontSize: 11, color: game.trickWinner === 0 || game.trickWinner === 2 ? t.ok : t.warm }}>
              {PLAYER_NAMES[game.trickWinner]} wins!
            </p>
          )}
        </div>
      </div>

      {/* Your hand */}
      <div style={{ padding: '8px 16px 20px', borderTop: `1px solid ${t.borderSubtle}` }}>
        <p style={{ ...mono, fontSize: 9, color: yourTurn ? t.ok : t.ornInk, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
          {yourTurn ? '▲ Your turn' : 'You'}
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {yourHand.map(card => (
            <CardView
              key={card.id}
              card={card}
              playable={playableIds.has(card.id)}
              onClick={() => onPlayCard(card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({ game, onPlayAgain, onChangeBet }: { game: GameState; onPlayAgain: () => void; onChangeBet: () => void }) {
  const t = useTheme();
  const mono = { fontFamily: "'Geist Mono Variable', monospace" } as const;
  const won = yourTeamWon(game);
  const result = rupeeResult(game);
  const yourTricks = teamTricks(game, YOUR_TEAM);
  const oppTricks = teamTricks(game, OPP_TEAM);

  return (
    <div style={{ minHeight: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Medallion size={64} primary={won ? t.ok : t.warm} secondary={t.cool} accent={t.accent} stroke={1.5} rays={16} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: 28, fontWeight: 700, color: won ? t.ok : t.warm, letterSpacing: '-0.02em' }}>
            {won ? 'You won!' : 'You lost.'}
          </p>
          <p style={{ ...mono, fontSize: 13, color: t.muted, marginTop: 6 }}>
            {yourTricks} – {oppTricks} tricks
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 32px', borderRadius: 8, background: t.card, border: `1px solid ${t.border}` }}>
          <p style={{ ...mono, fontSize: 11, color: t.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>rupees</p>
          <p style={{ ...mono, fontSize: 32, fontWeight: 700, color: won ? t.ok : t.warm, letterSpacing: '-0.03em' }}>
            {won ? '+' : ''}₨{Math.abs(result)}
          </p>
          <p style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 4 }}>
            Bet was ₨{game.bet}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onPlayAgain}
            style={{ ...mono, fontSize: 12, fontWeight: 600, padding: '10px 20px', borderRadius: 5, border: 'none', background: t.warm, color: t.bg, cursor: 'pointer' }}
          >
            Play again
          </button>
          <button onClick={onChangeBet}
            style={{ ...mono, fontSize: 12, fontWeight: 500, padding: '10px 20px', borderRadius: 5, border: `1px solid ${t.border}`, background: 'transparent', color: t.muted, cursor: 'pointer' }}
          >
            Change bet
          </button>
        </div>
      </div>
      <OrnamentStrip height={24} palette={{ ink: t.ornInk, warm: t.warm, cool: t.cool, accent: t.accent }} />
    </div>
  );
}
