import type { Card, Suit } from './cards';
import { cardBeats, dealHands, sortHand } from './cards';

// Players: 0 = You, 1 = Bot-Left, 2 = Bot-Partner, 3 = Bot-Right
// Teams:   0 + 2 = Your team   |   1 + 3 = Opponent team
export type PlayerIndex = 0 | 1 | 2 | 3;

export const PLAYER_NAMES = ['You', 'Left', 'Partner', 'Right'] as const;
export const YOUR_TEAM = [0, 2] as PlayerIndex[];
export const OPP_TEAM  = [1, 3] as PlayerIndex[];

export type GamePhase =
  | 'bet'          // Choose how many rupees to wager
  | 'call_rung'    // You pick trump suit
  | 'playing'      // Main trick-play loop
  | 'trick_end'    // Brief pause showing trick result
  | 'game_over';   // Final result

export interface TrickCard {
  player: PlayerIndex;
  card: Card;
}

export interface GameState {
  phase:        GamePhase;
  hands:        Record<PlayerIndex, Card[]>;
  trump:        Suit | null;
  bet:          number;
  currentTrick: TrickCard[];
  trickWinner:  PlayerIndex | null;   // set during trick_end
  ledSuit:      Suit | null;
  currentPlayer: PlayerIndex;
  tricksWon:    Record<PlayerIndex, number>;  // per-player trick count
  trickHistory: TrickCard[][];
  lastTrickWinner: PlayerIndex | null;
}

export function teamTricks(state: GameState, team: PlayerIndex[]): number {
  return team.reduce<number>((s, p) => s + state.tricksWon[p], 0);
}

export function initGame(bet: number): GameState {
  const [h0, h1, h2, h3] = dealHands();
  return {
    phase: 'call_rung',
    hands: { 0: h0, 1: h1, 2: h2, 3: h3 },
    trump: null,
    bet,
    currentTrick: [],
    trickWinner: null,
    ledSuit: null,
    currentPlayer: 0,       // You always lead first
    tricksWon: { 0: 0, 1: 0, 2: 0, 3: 0 },
    trickHistory: [],
    lastTrickWinner: null,
  };
}

export function callRung(state: GameState, trump: Suit): GameState {
  const sorted = { ...state.hands };
  for (const p of [0, 1, 2, 3] as PlayerIndex[]) {
    sorted[p] = sortHand(state.hands[p], trump);
  }
  return { ...state, trump, hands: sorted, phase: 'playing' };
}

export function playCard(state: GameState, player: PlayerIndex, card: Card): GameState {
  if (state.phase !== 'playing') return state;
  if (state.currentPlayer !== player) return state;

  const newHand = state.hands[player].filter(c => c.id !== card.id);
  const newTrick: TrickCard[] = [...state.currentTrick, { player, card }];
  const isFirstCard = state.currentTrick.length === 0;
  const ledSuit = isFirstCard ? card.suit : state.ledSuit;

  const newState: GameState = {
    ...state,
    hands: { ...state.hands, [player]: newHand },
    currentTrick: newTrick,
    ledSuit,
  };

  // All 4 cards played — resolve trick
  if (newTrick.length === 4) {
    return resolveTrick(newState, newTrick, ledSuit!);
  }

  // Next player
  const next = ((player + 1) % 4) as PlayerIndex;
  return { ...newState, currentPlayer: next };
}

function resolveTrick(state: GameState, trick: TrickCard[], ledSuit: Suit): GameState {
  const trump = state.trump!;
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (cardBeats(trick[i].card, winner.card, ledSuit, trump)) {
      winner = trick[i];
    }
  }

  const newTricksWon = { ...state.tricksWon, [winner.player]: state.tricksWon[winner.player] + 1 };
  const newHistory = [...state.trickHistory, trick];

  // Check game over (all 13 tricks played)
  const totalPlayed = newHistory.length;
  const phase: GamePhase = totalPlayed === 13 ? 'game_over' : 'trick_end';

  return {
    ...state,
    tricksWon: newTricksWon,
    trickHistory: newHistory,
    currentTrick: [],
    trickWinner: winner.player,
    lastTrickWinner: winner.player,
    ledSuit: null,
    currentPlayer: winner.player,   // trick winner leads next
    phase,
  };
}

/** Call after trick_end pause to resume playing */
export function nextTrick(state: GameState): GameState {
  if (state.phase !== 'trick_end') return state;
  return { ...state, phase: 'playing', trickWinner: null };
}

export function yourTeamWon(state: GameState): boolean {
  return teamTricks(state, YOUR_TEAM) > teamTricks(state, OPP_TEAM);
}

export function rupeeResult(state: GameState): number {
  return yourTeamWon(state) ? state.bet : -state.bet;
}
