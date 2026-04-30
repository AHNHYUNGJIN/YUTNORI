import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BOARD_NODES, boardPathFor, destinationFromPath } from './board';
import { applyMove, applyRoll, createInitialGame, legalMoves, resultFromFaces } from './yutnori-rules';
import type { PlayerId, PlayerState, YutResult } from './types';

const players: PlayerState[] = [
  { id: 0, name: '나', isAi: false, color: '#f00' },
  { id: 1, name: 'AI', isAi: true, color: '#00f' },
];
const yr = (steps: number, name: YutResult['name'] = '도'): YutResult => ({
  steps,
  name,
  extraTurn: steps >= 4,
  faces: [true, false, false, false],
});

describe('board graph', () => {
  it('has 28 nodes and shortcuts', () => {
    expect(BOARD_NODES).toHaveLength(28);
    expect(boardPathFor(5, 2)).toEqual([5, 21]);
    expect(destinationFromPath(boardPathFor(19, 2))).toBe('HOME');
  });
});

describe('yut rules', () => {
  it('maps faces to Korean yut results', () => {
    expect(resultFromFaces([true, false, false, false]).name).toBe('도');
    expect(resultFromFaces([false, false, false, false]).name).toBe('모');
    expect(resultFromFaces([true, true, true, true]).name).toBe('백도');
    expect(resultFromFaces([true, true, true, true], true).name).toBe('낙');
  });

  it('moves, carries and captures softly', () => {
    let s = createInitialGame(players);
    s = applyRoll(s, yr(1));
    let m = legalMoves(s)[0];
    s = applyMove(s, m);
    expect(s.pawns[0].position).toBe(1);
    s = { ...s, currentPlayer: 1, pendingRolls: [yr(1)] };
    m = legalMoves(s, 1)[0];
    s = applyMove(s, m);
    expect(s.pawns[0].position).toBe('BASE');
    expect(s.pawns[4].position).toBe(1);
  });

  it('wins when all pawns reach home', () => {
    const s = {
      ...createInitialGame(players),
      pawns: createInitialGame(players).pawns.map((p) => (p.playerId === 0 ? { ...p, position: p.id === 0 ? 19 : 'HOME' as const } : p)),
      pendingRolls: [yr(2)],
    };
    const ns = applyMove(s, legalMoves(s)[0]);
    expect(ns.winner).toBe(0);
  });

  it('property: legal moves never create invalid positions', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 80 }), (rolls) => {
        let s = createInitialGame(players);
        for (const st of rolls) {
          if (s.winner) break;
          s = applyRoll(s, yr(st));
          const moves = legalMoves(s);
          if (moves.length) {
            s = applyMove(s, moves.sort((a, b) => b.score - a.score)[0]);
          } else {
            s = { ...s, pendingRolls: [], currentPlayer: ((s.currentPlayer + 1) % s.players.length) as PlayerId };
          }
        }
        expect(
          s.pawns.every(
            (p) => p.position === 'BASE' || p.position === 'HOME' || (typeof p.position === 'number' && p.position >= 1 && p.position <= 28),
          ),
        ).toBe(true);
      }),
    );
  });
});
