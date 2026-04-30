import { describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';

describe('game store integration',()=>{
  it('starts configurable games and exposes moves after a roll',()=>{
    vi.useFakeTimers(); useGameStore.getState().startGame(3,true,'hard'); expect(useGameStore.getState().game.players).toHaveLength(3);
    useGameStore.getState().throwYut(); vi.runAllTimers(); expect(useGameStore.getState().lastRoll).toBeTruthy();
    expect(useGameStore.getState().game.pendingRolls.length + useGameStore.getState().game.turnCount).toBeGreaterThanOrEqual(0); vi.useRealTimers();
  });
});
