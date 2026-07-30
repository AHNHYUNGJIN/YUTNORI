import type { PawnState, PlayerId, PlayerState } from '../domain/types';
import { AVATARS } from './playerTheme';

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
    <h2 className="font-display mb-3 text-xl">가족 점수판</h2>
    <div className="space-y-2.5">
      {players.map((pl) => {
        const mine = pawns.filter((p) => p.playerId === pl.id);
        const base = mine.filter((p) => p.position === 'BASE');
        const home = mine.filter((p) => p.position === 'HOME').length;
        const onBoard = mine.length - base.length - home;
        const isTurn = pl.id === currentPlayer;
        return <div key={pl.id}
          className={`rounded-2xl p-3 transition ${isTurn ? 'ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,.4)]' : ''}`}
          style={{ backgroundColor: `${pl.color}1f` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg shadow-[inset_0_2px_2px_rgba(255,255,255,.6),0_3px_5px_rgba(0,0,0,.3)]"
                style={{ background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.8), ${pl.color} 60%)` }} aria-hidden>{AVATARS[pl.id]}</span>
              <span className="font-display truncate text-lg">{pl.name}{pl.isAi ? ' 🤖' : ''}</span>
              {isTurn && <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-amber-950 shadow">차례</span>}
            </span>
            <span role="img" aria-label={`도착한 말 ${home}개`} className="shrink-0 text-lg tracking-tight">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className={i < home ? '' : 'opacity-30 grayscale'}>⭐</span>
              ))}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">대기</span>
            {base.length === 0 && <span className="text-sm font-bold text-slate-800 dark:text-slate-200">없음</span>}
            {base.map((p) => {
              const movable = movablePawnIds.has(p.id);
              return <button key={p.id} type="button"
                aria-label={`${pl.name} 대기 말 출발시키기`}
                disabled={!movable}
                onClick={() => onPawnSelect?.(p.id)}
                className={`h-8 w-8 rounded-full border-2 border-white transition ${movable ? 'animate-pulse ring-2 ring-amber-400 hover:scale-110' : 'opacity-70'}`}
                style={{ background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.75), ${pl.color} 55%, rgba(0,0,0,.35))`, boxShadow: '0 3px 5px rgba(0,0,0,.35)' }} />;
            })}
            <span className="ml-auto rounded-full bg-white/80 px-2.5 py-0.5 text-sm font-black text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100">판 위 {onBoard}</span>
          </div>
        </div>;
      })}
    </div>
  </aside>;
}
