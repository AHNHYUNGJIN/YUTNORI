import type { PlayerId, PlayerState } from '../domain/types';

export function TurnIndicator({ players, currentPlayer, message }: { players: PlayerState[]; currentPlayer: PlayerId; message: string }) {
  const current = players.find((x) => x.id === currentPlayer)!;
  return <header className="rounded-3xl bg-blue-700 p-4 text-white shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-bold opacity-90">현재 차례</p>
        <h1 className="text-2xl font-black">{current.name} {current.isAi ? '🤖' : '👨‍👩‍👧'}</h1>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {players.map((p) => (
          <span key={p.id}
            className={`inline-block h-4 w-4 rounded-full border-2 ${p.id === currentPlayer ? 'scale-125 border-yellow-300' : 'border-white/50 opacity-70'}`}
            style={{ backgroundColor: p.color }} />
        ))}
      </div>
    </div>
    <p aria-live="polite" className="mt-2 rounded-2xl bg-white/15 p-2 text-lg font-bold">{message}</p>
  </header>;
}
