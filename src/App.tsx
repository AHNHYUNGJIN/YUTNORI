import { useEffect, useMemo, useState } from 'react';
import { YutBoard } from './components/YutBoard';
import { YutSticks } from './components/YutSticks';
import { TurnIndicator } from './components/TurnIndicator';
import { ScorePanel } from './components/ScorePanel';
import { Tutorial } from './components/Tutorial';
import { selectAvailableMovesForPawn, useGameStore } from './store/gameStore';
import { persistSettings, useSettingsStore } from './store/settingsStore';
import './index.css';

export default function App(){
  const { game, lastRoll, rolling, throwYut, selectPawn, startGame, moves } = useGameStore();
  const { sound, music, dark, toggleSound, toggleMusic, toggleDark } = useSettingsStore();
  const [players,setPlayers]=useState(2); const [ai,setAi]=useState(true); const [difficulty,setDifficulty]=useState<'easy'|'normal'|'hard'>('normal');
  useEffect(()=>{persistSettings(); document.documentElement.classList.toggle('dark', dark);},[dark]);
  const available = moves(); const humanTurn = !game.players.find(p=>p.id===game.currentPlayer)?.isAi;
  const highlighted = useMemo(()=>selectAvailableMovesForPawn(available),[available]);
  return <main className="safe-bottom min-h-screen bg-gradient-to-br from-orange-50 to-sky-100 p-3 text-blue-950 dark:from-slate-950 dark:to-blue-950 dark:text-blue-50 sm:p-6">
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4"><TurnIndicator players={game.players} currentPlayer={game.currentPlayer} message={game.message}/><YutBoard pawns={game.pawns} highlighted={highlighted} onPawnSelect={selectPawn}/></div>
      <div className="space-y-4"><YutSticks result={lastRoll} rolling={rolling} onThrow={throwYut}/>
        <div className="rounded-3xl bg-white p-4 shadow-lg dark:bg-slate-800"><h2 className="text-xl font-black">새 판 만들기</h2><div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold"><label>인원<select aria-label="인원" className="mt-1 w-full rounded-xl p-3 text-blue-950" value={players} onChange={e=>setPlayers(Number(e.target.value))}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label><label>AI 난이도<select aria-label="AI 난이도" className="mt-1 w-full rounded-xl p-3 text-blue-950" value={difficulty} onChange={e=>setDifficulty(e.target.value as any)}><option value="easy">쉬움</option><option value="normal">보통</option><option value="hard">어려움</option></select></label></div><label className="mt-3 flex items-center gap-2 font-bold"><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/> 마지막 선수 AI</label><button className="mt-3 min-h-12 w-full rounded-2xl bg-rose-500 font-black text-white" onClick={()=>startGame(players,ai,difficulty)}>새 게임</button></div>
        <ScorePanel players={game.players} pawns={game.pawns}/><div className="grid grid-cols-3 gap-2"><button onClick={toggleSound} className="rounded-2xl bg-white p-3 font-bold dark:bg-slate-800">효과음 {sound?'켬':'끔'}</button><button onClick={toggleMusic} className="rounded-2xl bg-white p-3 font-bold dark:bg-slate-800">음악 {music?'켬':'끔'}</button><button onClick={toggleDark} className="rounded-2xl bg-white p-3 font-bold dark:bg-slate-800">다크</button></div><Tutorial/>{!humanTurn && <p className="rounded-2xl bg-amber-200 p-3 text-center font-black text-blue-950">컴퓨터가 생각 중이에요…</p>}{game.winner!==undefined && <div role="alert" className="rounded-3xl bg-yellow-300 p-5 text-center text-2xl font-black text-blue-950">{game.players.find(p=>p.id===game.winner)?.name} 승리!</div>}</div>
    </div>
  </main>;
}
