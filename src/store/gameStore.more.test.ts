import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyRoll, resultFromSteps } from '../domain/yutnori-rules';
import { selectAvailableMovesForPawn, useGameStore } from './gameStore';

describe('game store actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useGameStore.getState().startGame(2, false, 'easy');
  });

  it('blocks throwing once the budget is used up', () => {
    // 개(배 2개) + 낙 아님으로 고정
    const rng = vi.spyOn(Math, 'random');
    [0.9, 0.9, 0.1, 0.1, 0.9].forEach((v) => rng.mockReturnValueOnce(v));
    useGameStore.getState().throwYut();
    vi.advanceTimersByTime(600);
    expect(useGameStore.getState().lastRoll?.name).toBe('개');
    expect(useGameStore.getState().game.throwsLeft).toBe(0);
    useGameStore.getState().throwYut();
    expect(useGameStore.getState().rolling).toBe(false);
    rng.mockRestore();
  });

  it('applies a single-option move immediately and passes the turn', () => {
    useGameStore.setState({ game: applyRoll(useGameStore.getState().game, resultFromSteps(1)) });
    useGameStore.getState().selectPawn(0);
    vi.runAllTimers();
    const { game } = useGameStore.getState();
    expect(game.pawns[0].position).toBe(1);
    expect(game.currentPlayer).toBe(1);
    expect(game.throwsLeft).toBe(1);
  });

  it('offers a destination choice when several rolls are pending', () => {
    let game = useGameStore.getState().game;
    game = applyRoll({ ...game, throwsLeft: 2 }, resultFromSteps(2));
    game = applyRoll(game, resultFromSteps(3));
    useGameStore.setState({ game });
    useGameStore.getState().selectPawn(0);
    expect(useGameStore.getState().selectedPawn).toBeDefined();
    expect(useGameStore.getState().game.pawns[0].position).toBe('BASE');
    useGameStore.getState().selectDestination(3);
    vi.runAllTimers();
    expect(useGameStore.getState().game.pawns[0].position).toBe(3);
  });

  it('gives gentle feedback for pawns that cannot move and filters highlights', () => {
    useGameStore.getState().selectPawn(4); // 상대 말
    expect(useGameStore.getState().game.message).toContain('던져');
    useGameStore.setState({ game: applyRoll(useGameStore.getState().game, resultFromSteps(1)) });
    const all = useGameStore.getState().moves();
    expect(selectAvailableMovesForPawn(all, all[0].pawnId)).toHaveLength(1);
  });

  it('ignores throws after a winner is decided', () => {
    useGameStore.setState({ game: { ...useGameStore.getState().game, winner: 0 }, rolling: false });
    useGameStore.getState().throwYut();
    expect(useGameStore.getState().rolling).toBe(false);
  });

  it('lets the AI play its whole turn and hand control back', () => {
    useGameStore.getState().startGame(2, true, 'easy');
    useGameStore.setState({ game: { ...useGameStore.getState().game, currentPlayer: 1 } });
    useGameStore.getState().aiStep();
    vi.runAllTimers();
    const { game } = useGameStore.getState();
    expect(useGameStore.getState().lastRoll).toBeTruthy();
    expect(game.currentPlayer).toBe(0);
    expect(game.turnCount).toBeGreaterThanOrEqual(1);
  });
});
