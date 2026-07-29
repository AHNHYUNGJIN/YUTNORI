import type { BoardNode, Position } from './types';

// 전통 윷판 29밭.
// 바깥 둘레 20밭: 0(참먹이·출발/도착, 오른쪽 아래) → 시계 반대 방향으로 1~19.
//   모서리: 5(오른쪽 위) · 10(왼쪽 위) · 15(왼쪽 아래)
// 지름길: 5 → 20 → 21 → 22(방) → 23 → 24 → 15
//         10 → 25 → 26 → 22(방) → 27 → 28 → 0
// 지름길은 모서리·방에 "멈춘" 다음 차례에만 진입할 수 있다(전통 규칙).
export const START = 0;
export const CENTER = 22;

const N = (id: number, x: number, y: number, label: string, kind: BoardNode['kind']): BoardNode => ({ id, x, y, label, kind });
export const BOARD_NODES: BoardNode[] = [
  N(0, 90, 90, '출발', 'start'),
  N(1, 90, 74, '', 'edge'), N(2, 90, 58, '', 'edge'), N(3, 90, 42, '', 'edge'), N(4, 90, 26, '', 'edge'),
  N(5, 90, 10, '', 'corner'),
  N(6, 74, 10, '', 'edge'), N(7, 58, 10, '', 'edge'), N(8, 42, 10, '', 'edge'), N(9, 26, 10, '', 'edge'),
  N(10, 10, 10, '', 'corner'),
  N(11, 10, 26, '', 'edge'), N(12, 10, 42, '', 'edge'), N(13, 10, 58, '', 'edge'), N(14, 10, 74, '', 'edge'),
  N(15, 10, 90, '', 'corner'),
  N(16, 26, 90, '', 'edge'), N(17, 42, 90, '', 'edge'), N(18, 58, 90, '', 'edge'), N(19, 74, 90, '', 'edge'),
  N(20, 76.7, 23.3, '', 'shortcut'), N(21, 63.3, 36.7, '', 'shortcut'),
  N(22, 50, 50, '방', 'center'),
  N(23, 36.7, 63.3, '', 'shortcut'), N(24, 23.3, 76.7, '', 'shortcut'),
  N(25, 23.3, 23.3, '', 'shortcut'), N(26, 36.7, 36.7, '', 'shortcut'),
  N(27, 63.3, 63.3, '', 'shortcut'), N(28, 76.7, 76.7, '', 'shortcut'),
];
export const nodeById = (id: number) => BOARD_NODES[id];

// 갈림길이 없을 때의 기본 다음 밭
const NEXT: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11,
  11: 12, 12: 13, 13: 14, 14: 15, 15: 16, 16: 17, 17: 18, 18: 19, 19: 0,
  20: 21, 21: 22, 22: 27, 23: 24, 24: 15, 25: 26, 26: 22, 27: 28, 28: 0,
};

type Step = number | 'HOME';
// 모서리 지름길은 그 밭에서 "출발"할 때만, 방(22)은 5번 지름길로 지나칠 때 직진(23) 유지
const nextOnPath = (node: number, prev: number | undefined, isMoveStart: boolean): Step => {
  if (node === START) return 'HOME';
  if (node === 5 && isMoveStart) return 20;
  if (node === 10 && isMoveStart) return 25;
  if (node === CENTER && !isMoveStart && prev === 21) return 23;
  return NEXT[node];
};

export interface PathResult { path: number[]; to: Position; }
/** from에서 steps칸 전진했을 때 지나는 밭과 도착지. 참먹이(0)를 지나면 HOME. */
export const forwardPath = (from: Position, steps: number): PathResult | undefined => {
  if (from === 'HOME' || steps <= 0) return undefined;
  const path: number[] = [];
  let prev: number | undefined;
  let current: number;
  let remaining = steps;
  let isMoveStart = from !== 'BASE';
  if (from === 'BASE') { current = 1; path.push(1); remaining -= 1; }
  else current = from;
  while (remaining > 0) {
    const nx = nextOnPath(current, prev, isMoveStart);
    isMoveStart = false;
    if (nx === 'HOME') return { path, to: 'HOME' };
    prev = current;
    current = nx;
    path.push(nx);
    remaining -= 1;
  }
  return { path, to: current };
};

// 남은 최단 거리(모서리·방에 멈춰 지름길을 탄다고 가정) — AI 평가용
const branchSuccessors = (node: number): Step[] => {
  if (node === START) return ['HOME'];
  if (node === 5) return [6, 20];
  if (node === 10) return [11, 25];
  if (node === CENTER) return [23, 27];
  return [NEXT[node]];
};
const DIST: number[] = (() => {
  const d = new Array<number>(29).fill(99);
  for (let iter = 0; iter < 40; iter += 1) {
    for (let n = 0; n < 29; n += 1) {
      const best = Math.min(...branchSuccessors(n).map((s) => (s === 'HOME' ? 0 : d[s])));
      d[n] = Math.min(d[n], 1 + best);
    }
  }
  return d;
})();
export const distanceToHome = (p: Position): number => (p === 'HOME' ? 0 : p === 'BASE' ? 1 + DIST[1] : DIST[p]);
