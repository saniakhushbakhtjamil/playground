export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "A-spades"
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Higher index = higher rank
const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function rankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

export function cardBeats(challenger: Card, incumbent: Card, ledSuit: Suit, trump: Suit): boolean {
  // Challenger beats incumbent if:
  // 1. Challenger is trump and incumbent is not
  // 2. Both are same suit and challenger has higher rank
  if (challenger.suit === trump && incumbent.suit !== trump) return true;
  if (challenger.suit !== trump && incumbent.suit === trump) return false;
  if (challenger.suit === incumbent.suit) return rankValue(challenger.rank) > rankValue(incumbent.rank);
  // Different non-trump suits — challenger doesn't beat (only led suit matters)
  // Challenger must be of led suit to beat; if not, can't beat
  if (challenger.suit !== ledSuit) return false;
  return true;
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHands(): [Card[], Card[], Card[], Card[]] {
  const deck = shuffle(makeDeck());
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}

// Suit display helpers
export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

export const SUIT_LABEL: Record<Suit, string> = {
  spades: 'Spades', hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs',
};

export function sortHand(hand: Card[], trump: Suit | null): Card[] {
  return [...hand].sort((a, b) => {
    // Trump cards first
    const aT = trump && a.suit === trump ? 1 : 0;
    const bT = trump && b.suit === trump ? 1 : 0;
    if (aT !== bT) return bT - aT;
    // Then by suit
    if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    // Then by rank descending
    return rankValue(b.rank) - rankValue(a.rank);
  });
}
