import { describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';

describe('game store integration', () => {
  it('starts configurable games and rolls within the throw budget', () => {
    vi.useFakeTimers();
    useGameStore.getState().startGame(3, true, 'hard');
    const { game } = useGameStore.getState();
    expect(game.players).toHaveLength(3);
    expect(game.players[2].isAi).toBe(true);
    expect(game.players[2].difficulty).toBe('hard');
    expect(game.throwsLeft).toBe(1);
    useGameStore.getState().throwYut();
    vi.advanceTimersByTime(600);
    expect(useGameStore.getState().lastRoll).toBeTruthy();
    vi.useRealTimers();
  });
});
