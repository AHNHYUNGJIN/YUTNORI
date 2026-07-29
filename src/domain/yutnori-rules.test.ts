import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BOARD_NODES, distanceToHome, forwardPath } from './board';
import {
  applyMove, applyRoll, createInitialGame, endTurnIfStuck, legalMoves, resultFromFaces, resultFromSteps,
} from './yutnori-rules';
import type { PlayerState } from './types';

const players: PlayerState[] = [
  { id: 0, name: '나', isAi: false, color: '#f00' },
  { id: 1, name: 'AI', isAi: true, color: '#00f' },
];

describe('board graph', () => {
  it('has the 29 stations of a traditional board', () => {
    expect(BOARD_NODES).toHaveLength(29);
  });

  it('enters from BASE and travels the outer ring without mid-move shortcuts', () => {
    expect(forwardPath('BASE', 1)).toEqual({ path: [1], to: 1 });
    expect(forwardPath('BASE', 5)).toEqual({ path: [1, 2, 3, 4, 5], to: 5 });
    expect(forwardPath(4, 2)).toEqual({ path: [5, 6], to: 6 });
  });

  it('takes shortcuts only when starting from a corner or the center', () => {
    expect(forwardPath(5, 2)).toEqual({ path: [20, 21], to: 21 });
    expect(forwardPath(10, 3)).toEqual({ path: [25, 26, 22], to: 22 });
    expect(forwardPath(21, 2)).toEqual({ path: [22, 23], to: 23 });
    expect(forwardPath(22, 3)).toEqual({ path: [27, 28, 0], to: 0 });
  });

  it('finishes by passing the start corner', () => {
    expect(forwardPath(19, 1)?.to).toBe(0);
    expect(forwardPath(19, 2)?.to).toBe('HOME');
    expect(forwardPath(0, 5)?.to).toBe('HOME');
    expect(forwardPath(28, 3)?.to).toBe('HOME');
  });

  it('measures remaining distance for AI heuristics', () => {
    expect(distanceToHome('HOME')).toBe(0);
    expect(distanceToHome(0)).toBe(1);
    expect(distanceToHome('BASE')).toBe(12);
    expect(distanceToHome(5)).toBeLessThan(distanceToHome(4));
  });
});

describe('yut rules', () => {
  it('maps stick faces to every Korean yut result including 윷 and 백도', () => {
    expect(resultFromFaces([false, false, false, false]).name).toBe('모');
    expect(resultFromFaces([false, true, false, false]).name).toBe('도');
    expect(resultFromFaces([true, false, false, false]).name).toBe('백도');
    expect(resultFromFaces([true, true, false, false]).name).toBe('개');
    expect(resultFromFaces([true, true, true, false]).name).toBe('걸');
    expect(resultFromFaces([true, true, true, true]).name).toBe('윷');
    expect(resultFromFaces([true, true, true, true]).extraTurn).toBe(true);
    expect(resultFromFaces([false, false, false, false]).extraTurn).toBe(true);
    expect(resultFromFaces([true, true, true, true], true).name).toBe('낙');
  });

  it('budgets throws: one per turn, one extra for 윷·모', () => {
    let s = createInitialGame(players);
    expect(s.throwsLeft).toBe(1);
    s = applyRoll(s, resultFromSteps(4));
    expect(s.throwsLeft).toBe(1);
    s = applyRoll(s, resultFromSteps(1));
    expect(s.throwsLeft).toBe(0);
    expect(s.pendingRolls).toHaveLength(2);
  });

  it('낙 wastes the throw and the turn passes when nothing is playable', () => {
    let s = createInitialGame(players);
    s = applyRoll(s, resultFromFaces([true, false, true, true], true));
    expect(s.pendingRolls).toHaveLength(0);
    expect(s.throwsLeft).toBe(0);
    const passed = endTurnIfStuck(s);
    expect(passed.currentPlayer).toBe(1);
    expect(passed.throwsLeft).toBe(1);
  });

  it('moves, captures with a bonus throw, and sends the victim home', () => {
    let s = createInitialGame(players);
    s = applyRoll(s, resultFromSteps(1));
    s = applyMove(s, legalMoves(s)[0]);
    expect(s.pawns[0].position).toBe(1);
    expect(s.currentPlayer).toBe(1);
    s = applyRoll(s, resultFromSteps(1));
    const capture = legalMoves(s).find((m) => m.captures.length > 0)!;
    s = applyMove(s, capture);
    expect(s.pawns[0].position).toBe('BASE');
    expect(s.pawns[0].track).toEqual([]);
    expect(s.pawns[4].position).toBe(1);
    expect(s.currentPlayer).toBe(1);
    expect(s.throwsLeft).toBe(1);
  });

  it('carries stacked pawns together', () => {
    let s = createInitialGame(players);
    s = {
      ...s,
      pawns: s.pawns.map((p) => (p.id <= 1 ? { ...p, position: 3, track: [1, 2, 3] } : p)),
      pendingRolls: [resultFromSteps(2)],
      throwsLeft: 0,
    };
    const moves = legalMoves(s);
    expect(moves).toHaveLength(2); // 업힌 무리 1 + 대기 말 1 (무리는 대표 말 하나로만 제시)
    const stackMove = moves.find((m) => m.from === 3)!;
    expect(stackMove.carries.sort()).toEqual([0, 1]);
    s = applyMove(s, stackMove);
    expect(s.pawns[0].position).toBe(5);
    expect(s.pawns[1].position).toBe(5);
    expect(s.pawns[0].stack.sort()).toEqual([0, 1]);
  });

  it('백도 walks back along the traveled path, even through shortcuts', () => {
    let s = createInitialGame(players);
    s = {
      ...s,
      pawns: s.pawns.map((p) => (p.id === 0 ? { ...p, position: 21, track: [1, 2, 3, 4, 5, 20, 21] } : p)),
      pendingRolls: [resultFromSteps(-1)],
      throwsLeft: 0,
    };
    const move = legalMoves(s)[0];
    expect(move.to).toBe(20);
    s = applyMove(s, move);
    expect(s.pawns[0].track).toEqual([1, 2, 3, 4, 5, 20]);
  });

  it('백도 from the first station reaches the start corner, ready to finish', () => {
    let s = createInitialGame(players);
    s = {
      ...s,
      pawns: s.pawns.map((p) => (p.id === 0 ? { ...p, position: 1, track: [1] } : p)),
      pendingRolls: [resultFromSteps(-1)],
      throwsLeft: 0,
    };
    const move = legalMoves(s)[0];
    expect(move.to).toBe(0);
    s = applyMove(s, move);
    s = { ...s, currentPlayer: 0, pendingRolls: [resultFromSteps(3)], throwsLeft: 0 };
    const finish = legalMoves(s).find((m) => m.pawnId === 0)!;
    expect(finish.to).toBe('HOME');
  });

  it('백도 with every pawn waiting has no legal move and passes the turn', () => {
    let s = createInitialGame(players);
    s = applyRoll(s, resultFromSteps(-1));
    expect(legalMoves(s)).toHaveLength(0);
    const passed = endTurnIfStuck(s);
    expect(passed.currentPlayer).toBe(1);
    expect(passed.pendingRolls).toHaveLength(0);
  });

  it('wins when all pawns reach home', () => {
    const base = createInitialGame(players);
    const s = {
      ...base,
      pawns: base.pawns.map((p) => (p.playerId === 0 ? { ...p, position: p.id === 0 ? 19 : 'HOME' as const, track: p.id === 0 ? [19] : [] } : p)),
      pendingRolls: [resultFromSteps(2)],
      throwsLeft: 0,
    };
    const ns = applyMove(s, legalMoves(s)[0]);
    expect(ns.winner).toBe(0);
  });

  it('property: random play never creates invalid positions or broken tracks', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -1, max: 5 }).filter((n) => n !== 0), { minLength: 1, maxLength: 120 }), (rolls) => {
        let s = createInitialGame(players);
        for (const st of rolls) {
          if (s.winner !== undefined) break;
          s = applyRoll({ ...s, throwsLeft: Math.max(1, s.throwsLeft) }, resultFromSteps(st));
          const moves = legalMoves(s);
          if (moves.length) s = applyMove(s, [...moves].sort((a, b) => b.score - a.score)[0]);
          s = endTurnIfStuck(s);
        }
        expect(s.pawns.every((p) =>
          p.position === 'BASE' || p.position === 'HOME' || (typeof p.position === 'number' && p.position >= 0 && p.position <= 28),
        )).toBe(true);
        expect(s.pawns.every((p) =>
          typeof p.position !== 'number' || p.track.length === 0 || p.track[p.track.length - 1] === p.position,
        )).toBe(true);
      }),
    );
  });
});
