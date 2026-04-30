import { describe, expect, it } from 'vitest';
import { simulateGame } from '../ai/strategy';
import type { PlayerState } from '../domain/types';

const players: PlayerState[] = [
  { id: 0, name: '어려움', isAi: true, difficulty: 'hard', color: '#e11d48' },
  { id: 1, name: '보통', isAi: true, difficulty: 'normal', color: '#2563eb' },
  { id: 2, name: '쉬움', isAi: true, difficulty: 'easy', color: '#16a34a' },
];

describe('AI vs AI 1000-game harness', () => {
  it('guarantees termination and detects runaway games', () => {
    const wins = new Map<number, number>();
    let maxTurns = 0;
    for (let i = 0; i < 1000; i += 1) {
      const state = simulateGame(players, { 0: 'hard', 1: 'normal', 2: 'easy' }, i + 5000, 700);
      expect(state.winner).not.toBeUndefined();
      expect(state.turnCount).toBeLessThanOrEqual(700);
      maxTurns = Math.max(maxTurns, state.turnCount);
      wins.set(state.winner!, (wins.get(state.winner!) ?? 0) + 1);
    }
    expect(maxTurns).toBeLessThanOrEqual(700);
    expect((wins.get(0) ?? 0) + (wins.get(1) ?? 0) + (wins.get(2) ?? 0)).toBe(1000);
  });
});
