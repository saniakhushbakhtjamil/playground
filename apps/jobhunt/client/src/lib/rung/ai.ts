import type { Card, Suit } from './cards';
import { SUITS, rankValue, cardBeats } from './cards';
import type { GameState, PlayerIndex, TrickCard } from './engine';
import { YOUR_TEAM } from './engine';

// ── Rung calling ──────────────────────────────────────────────────────────────

/** Pick trump suit: most cards in hand, tiebreak by sum of rank values */
export function chooseTrump(hand: Card[]): Suit {
  const counts: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  const values: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  for (const c of hand) {
    counts[c.suit]++;
    values[c.suit] += rankValue(c.rank);
  }
  return SUITS.reduce((best, s) =>
    counts[s] > counts[best] || (counts[s] === counts[best] && values[s] > values[best])
      ? s : best
  , SUITS[0]);
}

// ── Trick play ────────────────────────────────────────────────────────────────

function cardsOfSuit(hand: Card[], suit: Suit): Card[] {
  return hand.filter(c => c.suit === suit);
}

function highest(cards: Card[]): Card {
  return cards.reduce((best, c) => rankValue(c.rank) > rankValue(best.rank) ? c : best);
}

function lowest(cards: Card[]): Card {
  return cards.reduce((best, c) => rankValue(c.rank) < rankValue(best.rank) ? c : best);
}

function currentWinner(trick: TrickCard[], ledSuit: Suit, trump: Suit): TrickCard {
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (cardBeats(trick[i].card, winner.card, ledSuit, trump)) winner = trick[i];
  }
  return winner;
}

function isMyTeamWinning(trick: TrickCard[], player: PlayerIndex, ledSuit: Suit, trump: Suit): boolean {
  if (trick.length === 0) return false;
  const winner = currentWinner(trick, ledSuit, trump);
  const myTeam = YOUR_TEAM.includes(player) ? YOUR_TEAM : [1, 3] as PlayerIndex[];
  return myTeam.includes(winner.player as PlayerIndex);
}

function lowestDiscard(hand: Card[], trump: Suit): Card {
  // Discard lowest non-trump if possible, else lowest trump
  const nonTrump = hand.filter(c => c.suit !== trump);
  return nonTrump.length > 0 ? lowest(nonTrump) : lowest(hand);
}

export function aiChooseCard(state: GameState, player: PlayerIndex): Card {
  const hand = state.hands[player];
  const trump = state.trump!;
  const trick = state.currentTrick;
  const ledSuit = state.ledSuit;

  // ── Leading ──────────────────────────────────────────────────────────────
  if (trick.length === 0 || ledSuit === null) {
    // Lead highest non-trump; if only trumps remain, lead highest trump
    const nonTrump = hand.filter(c => c.suit !== trump);
    return nonTrump.length > 0 ? highest(nonTrump) : highest(hand);
  }

  // ── Following ─────────────────────────────────────────────────────────────
  const suitCards = cardsOfSuit(hand, ledSuit);
  const teamWinning = isMyTeamWinning(trick, player, ledSuit, trump);
  const winner = currentWinner(trick, ledSuit, trump);

  // Must follow suit if possible
  if (suitCards.length > 0) {
    if (teamWinning) {
      // Partner is winning — play lowest to conserve good cards
      return lowest(suitCards);
    } else {
      // Try to beat current winner with same suit
      const beating = suitCards.filter(c => rankValue(c.rank) > rankValue(winner.card.rank) && c.suit === winner.card.suit);
      return beating.length > 0 ? lowest(beating) : lowest(suitCards);
    }
  }

  // Can't follow suit — consider trumping
  const trumpCards = hand.filter(c => c.suit === trump);

  if (teamWinning) {
    // Partner winning — no need to trump, discard lowest
    return lowestDiscard(hand, trump);
  }

  // Opponent is winning — trump if we have trumps
  if (trumpCards.length > 0) {
    // Beat current winner's trump if they already trumped, else any trump wins
    if (winner.card.suit === trump) {
      const overTrump = trumpCards.filter(c => rankValue(c.rank) > rankValue(winner.card.rank));
      if (overTrump.length > 0) return lowest(overTrump);
      // Can't over-trump — discard lowest non-trump
      return lowestDiscard(hand, trump);
    }
    // Winner is not trump — lowest trump wins
    return lowest(trumpCards);
  }

  // No trump, can't follow suit — discard lowest non-trump
  return lowestDiscard(hand, trump);
}
