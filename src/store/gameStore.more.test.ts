import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyRoll, legalMoves } from '../domain/yutnori-rules';
import type { YutResult } from '../domain/types';
import { selectAvailableMovesForPawn, useGameStore } from './gameStore';

const doRoll: YutResult = { name: '도', steps: 1, extraTurn: false, faces: [true, false, false, false] };

describe('game store actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useGameStore.getState().startGame(2, false, 'easy');
  });

  it('gives gentle feedback for unavailable pawn and filters move highlights', () => {
    useGameStore.setState({ game: applyRoll(useGameStore.getState().game, doRoll) });
    const allMoves = useGameStore.getState().moves();
    expect(selectAvailableMovesForPawn(allMoves, allMoves[0].pawnId)).toHaveLength(1);
    useGameStore.getState().selectPawn(999);
    expect(useGameStore.getState().game.message).toContain('괜찮아요');
  });

  it('applies selected moves and ignores throws after winner', () => {
    useGameStore.setState({ game: applyRoll(useGameStore.getState().game, doRoll) });
    const move = legalMoves(useGameStore.getState().game)[0];
    useGameStore.getState().applySelected(move);
    vi.runAllTimers();
    expect(useGameStore.getState().game.turnCount).toBe(1);
    useGameStore.setState({ game: { ...useGameStore.getState().game, winner: 0 }, rolling: false });
    useGameStore.getState().throwYut();
    expect(useGameStore.getState().rolling).toBe(false);
  });

  it('lets AI roll and move automatically', () => {
    useGameStore.getState().startGame(2, true, 'easy');
    useGameStore.setState({ game: { ...useGameStore.getState().game, currentPlayer: 1, pendingRolls: [] } });
    useGameStore.getState().aiStep();
    vi.runAllTimers();
    expect(useGameStore.getState().lastRoll).toBeTruthy();
    expect(useGameStore.getState().game.turnCount).toBeGreaterThanOrEqual(1);
  });
});
