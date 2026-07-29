import { motion } from 'framer-motion';
import { BOARD_NODES, nodeById } from '../domain/board';
import type { MoveOption, PawnState, PlayerState, Position } from '../domain/types';

interface Props {
  pawns: PawnState[];
  players: PlayerState[];
  moves: MoveOption[];
  selectedPawn?: number;
  onPawnSelect?: (id: number) => void;
  onDestinationSelect?: (to: Position) => void;
}

interface Token { key: string; leaderId: number; playerId: number; count: number; nodeId: number; }

const RING = [0, 5, 10, 15].map((id) => nodeById(id));
const TOKEN_OFFSETS = [[0, 0], [-2.4, 2.0], [2.4, 2.0], [0, -2.8]];

export function YutBoard({ pawns, players, moves, selectedPawn, onPawnSelect, onDestinationSelect }: Props) {
  const colorOf = (playerId: number) => players.find((p) => p.id === playerId)?.color ?? '#64748b';

  // 같은 밭의 같은 편 말은 하나의 토큰으로(업기), 여러 편이 겹치면 살짝 비껴 배치
  const tokens: Token[] = [];
  const groups = new Map<string, PawnState[]>();
  for (const p of pawns) {
    if (typeof p.position !== 'number') continue;
    const key = `${p.playerId}@${p.position}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  for (const [, members] of groups) {
    const leader = members.reduce((a, b) => (a.id < b.id ? a : b));
    tokens.push({ key: `t-${leader.playerId}-${leader.id}`, leaderId: leader.id, playerId: leader.playerId, count: members.length, nodeId: leader.position as number });
  }
  const byNode = new Map<number, Token[]>();
  for (const t of tokens) byNode.set(t.nodeId, [...(byNode.get(t.nodeId) ?? []), t]);

  const movableIds = new Set(moves.flatMap((m) => m.carries));
  const selectedMoves = selectedPawn === undefined ? [] : moves.filter((m) => m.pawnId === selectedPawn);
  const selectedIds = selectedPawn === undefined ? new Set<number>() : new Set(moves.find((m) => m.pawnId === selectedPawn)?.carries ?? [selectedPawn]);
  const homeTarget = selectedMoves.find((m) => m.to === 'HOME');

  return <section className="rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 p-3 shadow-xl ring-4 ring-amber-300 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-600" aria-label="윷판">
    <svg viewBox="-6 -6 112 112" className="mx-auto aspect-square w-full max-w-[640px]" role="img" aria-label="전통 윷놀이 판">
      <defs>
        <filter id="soft"><feDropShadow dx="0" dy="0.8" stdDeviation="0.9" floodOpacity=".3" /></filter>
      </defs>
      {/* 판의 틀: 바깥 사각형과 지름길 대각선 */}
      <polygon points={RING.map((n) => `${n.x},${n.y}`).join(' ')} className="fill-none stroke-amber-700/50 dark:stroke-amber-300/40" strokeWidth="1.6" />
      <line x1={RING[1].x} y1={RING[1].y} x2={RING[3].x} y2={RING[3].y} className="stroke-amber-700/50 dark:stroke-amber-300/40" strokeWidth="1.6" />
      <line x1={RING[2].x} y1={RING[2].y} x2={RING[0].x} y2={RING[0].y} className="stroke-amber-700/50 dark:stroke-amber-300/40" strokeWidth="1.6" />

      {/* 밭(스테이션) */}
      {BOARD_NODES.map((n) => {
        const big = n.kind !== 'edge' && n.kind !== 'shortcut';
        return <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={big ? 4.6 : 2.9} className="fill-amber-50 stroke-amber-800 dark:fill-slate-900 dark:stroke-amber-300" strokeWidth="1.1" filter="url(#soft)" />
          {big && <circle cx={n.x} cy={n.y} r={2.6} className="fill-none stroke-amber-800/70 dark:stroke-amber-300/70" strokeWidth="0.7" />}
          {n.label && <text x={n.x} y={n.y + (n.kind === 'start' ? 8.6 : -6)} textAnchor="middle" fontSize="3.4" fontWeight="700" className="fill-amber-900 dark:fill-amber-200">{n.label}</text>}
        </g>;
      })}

      {/* 선택한 말의 예상 경로 */}
      {selectedMoves.map((m, idx) => {
        const origin = typeof m.from === 'number' ? nodeById(m.from) : nodeById(0);
        const pts = [origin, ...m.path.map((id) => nodeById(id))];
        return <polyline key={`path-${idx}`} points={pts.map((n) => `${n.x},${n.y}`).join(' ')}
          className="fill-none stroke-blue-500/70" strokeWidth="1.3" strokeDasharray="2.6 2" strokeLinecap="round" />;
      })}

      {/* 목적지 선택 타깃 */}
      {selectedMoves.filter((m) => typeof m.to === 'number').map((m) => {
        const n = nodeById(m.to as number);
        return <g key={`dest-${m.to}-${m.result.name}`} role="button" tabIndex={0}
          aria-label={`${m.result.name}로 ${n.label || `${m.to}번 밭`}에 도착`}
          onClick={() => onDestinationSelect?.(m.to)}
          onKeyDown={(e) => { if (e.key === 'Enter') onDestinationSelect?.(m.to); }}
          className="cursor-pointer">
          <motion.circle cx={n.x} cy={n.y} r={5.4} animate={{ r: [5.2, 6.4, 5.2] }} transition={{ repeat: Infinity, duration: 1.1 }}
            className="fill-yellow-300/70 stroke-yellow-500" strokeWidth="1.2" />
          <text x={n.x} y={n.y - 6.4} textAnchor="middle" fontSize="3.6" fontWeight="800" className="fill-blue-700 dark:fill-yellow-200">{m.result.name}</text>
        </g>;
      })}
      {homeTarget && <g role="button" tabIndex={0} aria-label="골인하기" className="cursor-pointer"
        onClick={() => onDestinationSelect?.('HOME')}
        onKeyDown={(e) => { if (e.key === 'Enter') onDestinationSelect?.('HOME'); }}>
        <motion.circle cx={99} cy={99} r={6} animate={{ r: [5.6, 6.8, 5.6] }} transition={{ repeat: Infinity, duration: 1.1 }}
          className="fill-yellow-300 stroke-yellow-600" strokeWidth="1.2" />
        <text x={99} y={100.3} textAnchor="middle" fontSize="3.4" fontWeight="900" className="fill-blue-900">골인</text>
      </g>}

      {/* 말 토큰 */}
      {[...byNode.entries()].flatMap(([nodeId, list]) => {
        const n = nodeById(nodeId);
        return list.map((t, i) => {
          const [dx, dy] = list.length > 1 ? TOKEN_OFFSETS[i % TOKEN_OFFSETS.length] : TOKEN_OFFSETS[0];
          const movable = movableIds.has(t.leaderId);
          const isSelected = selectedIds.has(t.leaderId);
          return <motion.g key={t.key} role="button" tabIndex={0}
            aria-label={`${players.find((p) => p.id === t.playerId)?.name ?? ''} 말${t.count > 1 ? ` ${t.count}개 업음` : ''}`}
            onClick={() => onPawnSelect?.(t.leaderId)}
            onKeyDown={(e) => { if (e.key === 'Enter') onPawnSelect?.(t.leaderId); }}
            initial={false} animate={{ x: n.x + dx, y: n.y + dy, scale: isSelected ? 1.3 : 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 15 }} className="cursor-pointer">
            {movable && !isSelected && <motion.circle cx={0} cy={0} r={5.4} animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 1 }} fill="none" stroke="#facc15" strokeWidth="1.4" />}
            <circle cx={0} cy={0} r={4.2} fill={colorOf(t.playerId)} stroke={isSelected ? '#facc15' : '#ffffff'} strokeWidth="1.4" filter="url(#soft)" />
            {t.count > 1 && <>
              <circle cx={3} cy={-3} r={2.2} className="fill-white stroke-amber-600" strokeWidth="0.5" />
              <text x={3} y={-1.9} textAnchor="middle" fontSize="3" fontWeight="900" className="fill-amber-700">{t.count}</text>
            </>}
          </motion.g>;
        });
      })}
    </svg>
  </section>;
}
