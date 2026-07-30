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

/** hex 색을 흰색(target=255) 또는 검정(target=0) 쪽으로 p만큼 섞는다 — 구형 말의 하이라이트/음영 */
const mix = (hex: string, target: number, p: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v + (target - v) * p);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

export function YutBoard({ pawns, players, moves, selectedPawn, onPawnSelect, onDestinationSelect }: Props) {
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

  return <section className="board-stage px-1 py-2 sm:px-3 sm:py-4" aria-label="윷판">
    <svg viewBox="-8 -8 116 116" className="board-3d mx-auto aspect-square w-full max-w-[640px]" role="img" aria-label="전통 윷놀이 판">
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecd0a0" /><stop offset=".45" stopColor="#dcae72" /><stop offset="1" stopColor="#c08b4d" />
        </linearGradient>
        <radialGradient id="station" cx=".5" cy=".35" r=".95">
          <stop offset="0" stopColor="#fffdf4" /><stop offset="1" stopColor="#eed2a2" />
        </radialGradient>
        <radialGradient id="gold" cx=".5" cy=".35" r=".95">
          <stop offset="0" stopColor="#fef9c3" /><stop offset=".55" stopColor="#fde047" /><stop offset="1" stopColor="#ca8a04" />
        </radialGradient>
        {players.map((p) => (
          <radialGradient key={p.id} id={`pawn-grad-${p.id}`} cx=".35" cy=".28" r=".95">
            <stop offset="0" stopColor={mix(p.color, 255, 0.6)} />
            <stop offset=".55" stopColor={p.color} />
            <stop offset="1" stopColor={mix(p.color, 0, 0.45)} />
          </radialGradient>
        ))}
        <filter id="soft"><feDropShadow dx="0" dy="0.8" stdDeviation="0.9" floodOpacity=".35" /></filter>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* 나무판 */}
      <rect x="-8" y="-8" width="116" height="116" rx="10" fill="url(#wood)" />
      <rect x="-8" y="-8" width="116" height="116" rx="10" fill="none" stroke="#6b3a12" strokeWidth="1.8" opacity=".85" />
      <rect x="-4.5" y="-4.5" width="109" height="109" rx="7" fill="none" stroke="#8a4b1f" strokeWidth=".7" opacity=".55" />

      {/* 판의 틀: 바깥 사각형과 지름길 대각선 */}
      <polygon points={RING.map((n) => `${n.x},${n.y}`).join(' ')} className="fill-none" stroke="#7c3f14" strokeWidth="1.7" opacity=".5" />
      <line x1={RING[1].x} y1={RING[1].y} x2={RING[3].x} y2={RING[3].y} stroke="#7c3f14" strokeWidth="1.7" opacity=".5" />
      <line x1={RING[2].x} y1={RING[2].y} x2={RING[0].x} y2={RING[0].y} stroke="#7c3f14" strokeWidth="1.7" opacity=".5" />

      {/* 밭(스테이션) */}
      {BOARD_NODES.map((n) => {
        const big = n.kind !== 'edge' && n.kind !== 'shortcut';
        return <g key={n.id}>
          <circle cx={n.x} cy={n.y + 0.7} r={big ? 4.7 : 3} fill="#6b3a12" opacity=".35" />
          <circle cx={n.x} cy={n.y} r={big ? 4.6 : 2.9} fill="url(#station)" stroke="#8a4b1f" strokeWidth="1" filter="url(#soft)" />
          {big && <circle cx={n.x} cy={n.y} r={2.6} fill="none" stroke="#8a4b1f" strokeWidth="0.7" opacity=".8" />}
          {n.label && <text x={n.x} y={n.y + (n.kind === 'start' ? 8.8 : -6)} textAnchor="middle" fontSize="3.6" fontWeight="700" fill="#4a2008">{n.label}</text>}
        </g>;
      })}

      {/* 선택한 말의 예상 경로 */}
      {selectedMoves.map((m, idx) => {
        const origin = typeof m.from === 'number' ? nodeById(m.from) : nodeById(0);
        const pts = [origin, ...m.path.map((id) => nodeById(id))];
        return <polyline key={`path-${idx}`} points={pts.map((n) => `${n.x},${n.y}`).join(' ')}
          fill="none" stroke="#1d4ed8" strokeOpacity=".8" strokeWidth="1.4" strokeDasharray="2.6 2" strokeLinecap="round" />;
      })}

      {/* 목적지 선택 타깃 — 반짝이는 금빛 자리 */}
      {selectedMoves.filter((m) => typeof m.to === 'number').map((m) => {
        const n = nodeById(m.to as number);
        return <g key={`dest-${m.to}-${m.result.name}`} role="button" tabIndex={0}
          aria-label={`${m.result.name}로 ${n.label || `${m.to}번 밭`}에 도착`}
          onClick={() => onDestinationSelect?.(m.to)}
          onKeyDown={(e) => { if (e.key === 'Enter') onDestinationSelect?.(m.to); }}
          className="cursor-pointer">
          <motion.circle cx={n.x} cy={n.y} r={5.4} animate={{ r: [5.2, 6.5, 5.2] }} transition={{ repeat: Infinity, duration: 1.1 }}
            fill="url(#gold)" stroke="#a16207" strokeWidth="1.1" filter="url(#glow)" opacity=".92" />
          <text x={n.x} y={n.y - 6.6} textAnchor="middle" fontSize="3.8" fontWeight="800" fill="#3b1c04">{m.result.name}</text>
        </g>;
      })}
      {homeTarget && <g role="button" tabIndex={0} aria-label="골인하기" className="cursor-pointer"
        onClick={() => onDestinationSelect?.('HOME')}
        onKeyDown={(e) => { if (e.key === 'Enter') onDestinationSelect?.('HOME'); }}>
        <motion.circle cx={99.5} cy={99.5} r={6} animate={{ r: [5.6, 7, 5.6] }} transition={{ repeat: Infinity, duration: 1.1 }}
          fill="url(#gold)" stroke="#a16207" strokeWidth="1.1" filter="url(#glow)" />
        <text x={99.5} y={100.9} textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#3b1c04">골인</text>
      </g>}

      {/* 말 토큰 — 광택 있는 구슬 */}
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
            {movable && !isSelected && <motion.circle cx={0} cy={0} r={5.6} animate={{ opacity: [0.25, 0.8, 0.25] }} transition={{ repeat: Infinity, duration: 1 }} fill="none" stroke="#facc15" strokeWidth="1.5" filter="url(#glow)" />}
            <ellipse cx={0.4} cy={3.2} rx={3.6} ry={1.3} fill="#000" opacity=".3" />
            <circle cx={0} cy={0} r={4.2} fill={`url(#pawn-grad-${t.playerId})`} stroke={isSelected ? '#facc15' : '#ffffff'} strokeWidth="1.2" />
            <ellipse cx={-1.3} cy={-1.7} rx={1.5} ry={1} fill="#fff" opacity=".55" />
            {t.count > 1 && <>
              <circle cx={3.1} cy={-3.1} r={2.2} fill="#fffbeb" stroke="#b45309" strokeWidth="0.5" />
              <text x={3.1} y={-1.9} textAnchor="middle" fontSize="3" fontWeight="900" fill="#92400e">{t.count}</text>
            </>}
          </motion.g>;
        });
      })}
    </svg>
  </section>;
}
