import type { PlayerId, PlayerState } from '../domain/types';
import { AVATARS } from './playerTheme';

export function TurnIndicator({ players, currentPlayer, message }: { players: PlayerState[]; currentPlayer: PlayerId; message: string }) {
  const current = players.find((x) => x.id === currentPlayer)!;
  return <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-blue-800 to-sky-700 p-4 text-white shadow-[0_16px_30px_rgba(30,58,138,.35)] ring-1 ring-white/25">
    <div className="pointer-events-none absolute -top-10 left-1/4 h-28 w-28 rounded-full bg-white/20 blur-2xl" aria-hidden />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="font-display grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-amber-200 to-amber-500 text-2xl text-amber-950 shadow-[inset_0_2px_2px_rgba(255,255,255,.7),0_5px_10px_rgba(0,0,0,.35)]" aria-hidden>윷</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-100">YUTNORI · 현재 차례</p>
          <h1 className="font-display text-2xl leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,.4)]">
            <span aria-hidden>{AVATARS[current.id]} </span>{current.name}{current.isAi ? ' 🤖' : ''}
          </h1>
        </div>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {players.map((p) => (
          <span key={p.id}
            className={`grid h-8 w-8 place-items-center rounded-full border-2 text-sm shadow-inner transition ${p.id === currentPlayer ? 'scale-110 border-yellow-300 bg-white/25' : 'border-white/40 opacity-60'}`}
            style={{ backgroundColor: `${p.color}55` }}>{AVATARS[p.id]}</span>
        ))}
      </div>
    </div>
    <p aria-live="polite" className="mt-3 rounded-xl bg-blue-950/70 px-3 py-2 text-lg font-bold text-white ring-1 ring-white/20">{message}</p>
  </header>;
}
