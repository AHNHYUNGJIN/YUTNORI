import { describe, expect, it } from 'vitest';
import { applyRoll, createInitialGame, legalMoves, resultFromSteps } from '../domain/yutnori-rules';
import type { PlayerState } from '../domain/types';
import { chooseMove, runAiTournament, simulateGame, threatAt } from './strategy';

const players: PlayerState[] = [
  { id: 0, name: 'A', isAi: true, difficulty: 'hard', color: '#f00' },
  { id: 1, name: 'B', isAi: true, difficulty: 'easy', color: '#00f' },
];

describe('AI strategy', () => {
  it('chooses legal moves for every difficulty', () => {
    const s = applyRoll(createInitialGame(players), resultFromSteps(3));
    (['easy', 'normal', 'hard'] as const).forEach((d) => {
      expect(legalMoves(s)).toContainEqual(chooseMove(s, d, () => 0).move);
    });
  });

  it('prefers capturing when a capture is available', () => {
    let s = createInitialGame(players);
    s = {
      ...s,
      pawns: s.pawns.map((p) => {
        if (p.id === 0) return { ...p, position: 1, track: [1] };
        if (p.id === 4) return { ...p, position: 3, track: [1, 2, 3] };
        return p;
      }),
      pendingRolls: [resultFromSteps(2)],
      throwsLeft: 0,
    };
    const decision = chooseMove(s, 'normal', () => 0);
    expect(decision.move?.captures).toContain(4);
  });

  it('measures capture threat probabilities', () => {
    const s = createInitialGame(players);
    // 상대 대기 말이 개(6/16)로 2번 밭을 밟을 수 있다
    expect(threatAt(s, 2, 0)).toBeGreaterThan(0.3);
    expect(threatAt(s, 'BASE', 0)).toBe(0);
  });

  it('simulation always terminates with a winner', () => {
    const s = simulateGame(players, { 0: 'hard', 1: 'easy' }, 42, 500);
    expect(s.winner).not.toBeUndefined();
    expect(s.turnCount).toBeLessThanOrEqual(500);
  });

  it('100 game harness shows calibrated difficulty win rates', () => {
    const wins = runAiTournament(100);
    expect(wins.hard).toBeGreaterThanOrEqual(60);
    expect(wins.normal).toBeGreaterThanOrEqual(40);
    expect(wins.normal).toBeLessThanOrEqual(90);
    expect(wins.easy).toBeLessThanOrEqual(35);
  });
});
