import type { PawnState, PlayerId, PlayerState } from '../domain/types';

interface Props {
  players: PlayerState[];
  pawns: PawnState[];
  currentPlayer: PlayerId;
  movablePawnIds: Set<number>;
  onPawnSelect?: (id: number) => void;
}

/** 점수판 + 대기 말 트레이. 대기(BASE) 말은 여기서 눌러 출발시킨다. */
export function ScorePanel({ players, pawns, currentPlayer, movablePawnIds, onPawnSelect }: Props) {
  return <aside className="panel rounded-3xl p-4">
    <h2 className="mb-3 text-xl font-black">가족 점수판</h2>
    <div className="space-y-2">
      {players.map((pl) => {
        const mine = pawns.filter((p) => p.playerId === pl.id);
        const base = mine.filter((p) => p.position === 'BASE');
        const home = mine.filter((p) => p.position === 'HOME').length;
        const onBoard = mine.length - base.length - home;
        const isTurn = pl.id === currentPlayer;
        return <div key={pl.id}
          className={`rounded-2xl p-3 font-bold ${isTurn ? 'ring-2 ring-yellow-400' : ''}`}
          style={{ backgroundColor: `${pl.color}22` }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: pl.color }} aria-hidden />
              {pl.name}{pl.isAi ? ' 🤖' : ''}
              {isTurn && <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-blue-950">차례</span>}
            </span>
            <span className="text-sm">판 위 {onBoard} · 도착 {home}/4</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-slate-700 dark:text-slate-200">대기:</span>
            {base.length === 0 && <span className="text-xs text-slate-700 dark:text-slate-200">없음</span>}
            {base.map((p) => {
              const movable = movablePawnIds.has(p.id);
              return <button key={p.id} type="button"
                aria-label={`${pl.name} 대기 말 출발시키기`}
                disabled={!movable}
                onClick={() => onPawnSelect?.(p.id)}
                className={`h-7 w-7 rounded-full border-2 border-white transition ${movable ? 'animate-pulse ring-2 ring-yellow-400 hover:scale-110' : 'opacity-70'}`}
                style={{ background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.75), ${pl.color} 55%, rgba(0,0,0,.35))`, boxShadow: '0 3px 5px rgba(0,0,0,.35)' }} />;
            })}
            <span className="ml-auto text-base" role="img" aria-label={`도착한 말 ${home}개`}>{'⭐'.repeat(home)}</span>
          </div>
        </div>;
      })}
    </div>
  </aside>;
}
