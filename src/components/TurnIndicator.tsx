import type { PlayerId, PlayerState } from '../domain/types';

export function TurnIndicator({ players, currentPlayer, message }: { players: PlayerState[]; currentPlayer: PlayerId; message: string }) {
  const current = players.find((x) => x.id === currentPlayer)!;
  return <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 p-4 text-white shadow-[0_16px_30px_rgba(30,58,138,.35)] ring-1 ring-white/25">
    <div className="pointer-events-none absolute -top-10 left-1/4 h-28 w-28 rounded-full bg-white/20 blur-2xl" aria-hidden />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-bold opacity-90">현재 차례</p>
        <h1 className="text-2xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]">{current.name} {current.isAi ? '🤖' : '👨‍👩‍👧'}</h1>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {players.map((p) => (
          <span key={p.id}
            className={`inline-block h-4 w-4 rounded-full border-2 shadow-inner transition ${p.id === currentPlayer ? 'scale-125 border-yellow-300' : 'border-white/50 opacity-70'}`}
            style={{ backgroundColor: p.color }} />
        ))}
      </div>
    </div>
    <p aria-live="polite" className="mt-2 rounded-2xl bg-white/15 p-2 text-lg font-bold backdrop-blur-sm">{message}</p>
  </header>;
}
