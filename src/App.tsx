import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { YutBoard } from './components/YutBoard';
import { YutSticks } from './components/YutSticks';
import { TurnIndicator } from './components/TurnIndicator';
import { ScorePanel } from './components/ScorePanel';
import { Tutorial } from './components/Tutorial';
import { useGameStore } from './store/gameStore';
import { persistSettings, useSettingsStore } from './store/settingsStore';
import { setMusic } from './audio/sfx';
import './index.css';

export default function App() {
  const { game, lastRoll, rolling, selectedPawn, throwYut, selectPawn, selectDestination, startGame, moves } = useGameStore();
  const { sound, music, dark, toggleSound, toggleMusic, toggleDark } = useSettingsStore();
  const [players, setPlayers] = useState(2);
  const [ai, setAi] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  useEffect(() => { persistSettings(); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(() => { setMusic(music); return () => setMusic(false); }, [music]);

  const humanTurn = !game.players.find((p) => p.id === game.currentPlayer)?.isAi;
  const available = useMemo(() => (humanTurn ? moves() : []), [game, humanTurn]);
  const movablePawnIds = useMemo(() => new Set(available.flatMap((m) => m.carries)), [available]);
  const winner = game.winner !== undefined ? game.players.find((p) => p.id === game.winner) : undefined;

  return <main className="safe-bottom scene-bg min-h-screen p-3 text-blue-950 dark:text-blue-50 sm:p-6">
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <TurnIndicator players={game.players} currentPlayer={game.currentPlayer} message={game.message} />
        <YutBoard pawns={game.pawns} players={game.players} moves={available} selectedPawn={selectedPawn}
          onPawnSelect={selectPawn} onDestinationSelect={selectDestination} />
        <ScorePanel players={game.players} pawns={game.pawns} currentPlayer={game.currentPlayer}
          movablePawnIds={movablePawnIds} onPawnSelect={selectPawn} />
      </div>
      <div className="space-y-4">
        <YutSticks result={lastRoll} rolling={rolling} onThrow={throwYut}
          canThrow={humanTurn && game.winner === undefined && game.throwsLeft > 0}
          throwsLeft={humanTurn ? game.throwsLeft : 0} pendingRolls={game.pendingRolls} />
        {!humanTurn && game.winner === undefined && (
          <p className="panel rounded-2xl p-3 text-center font-black">🤖 컴퓨터가 생각 중이에요…</p>
        )}
        <div className="panel rounded-3xl p-4">
          <h2 className="text-xl font-black">새 판 만들기</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
            <label>인원
              <select aria-label="인원" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-blue-950" value={players} onChange={(e) => setPlayers(Number(e.target.value))}>
                {[2, 3, 4].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label>AI 난이도
              <select aria-label="AI 난이도" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-blue-950" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'normal' | 'hard')}>
                <option value="easy">쉬움</option><option value="normal">보통</option><option value="hard">어려움</option>
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 font-bold">
            <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} /> 마지막 선수 AI
          </label>
          <button className="btn-3d mt-3 min-h-12 w-full rounded-2xl bg-gradient-to-b from-rose-600 to-rose-800 font-black text-white shadow-[0_5px_0_#881337,0_10px_16px_rgba(136,19,55,.35)]" onClick={() => startGame(players, ai, difficulty)}>새 게임</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={toggleSound} className="btn-3d panel rounded-2xl p-3 font-bold">효과음 {sound ? '켬' : '끔'}</button>
          <button onClick={toggleMusic} className="btn-3d panel rounded-2xl p-3 font-bold">음악 {music ? '켬' : '끔'}</button>
          <button onClick={toggleDark} className="btn-3d panel rounded-2xl p-3 font-bold">다크</button>
        </div>
        <Tutorial />
      </div>
    </div>
    {winner && (
      <div role="alert" className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4">
        <motion.div initial={{ scale: 0.5, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="max-w-sm rounded-3xl bg-gradient-to-b from-yellow-200 to-amber-400 p-8 text-center text-blue-950 shadow-[0_24px_50px_rgba(0,0,0,.45)] ring-4 ring-yellow-100">
          <motion.p animate={{ y: [0, -12, 0], rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-6xl" aria-hidden>🏆</motion.p>
          <p className="mt-2 text-3xl font-black drop-shadow-[0_2px_0_rgba(255,255,255,.6)]">{winner.name} 승리!</p>
          <p className="mt-1 font-bold">모든 말이 무사히 도착했어요.</p>
          <button className="btn-3d mt-5 w-full rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 p-3 text-lg font-black text-white shadow-[0_5px_0_#1e3a8a]"
            onClick={() => startGame(players, ai, difficulty)}>다시 하기</button>
        </motion.div>
      </div>
    )}
  </main>;
}
