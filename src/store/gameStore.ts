import { create } from 'zustand';
import { chooseMove } from '../ai/strategy';
import { applyMove, applyRoll, createInitialGame, legalMoves, randomRoll } from '../domain/yutnori-rules';
import type { Difficulty, GameState, MoveOption, PlayerId, PlayerState, YutResult } from '../domain/types';

const defaultPlayers: PlayerState[] = [
  {id:0,name:'가족 1',isAi:false,color:'#ef4444'},
  {id:1,name:'컴퓨터',isAi:true,difficulty:'normal',color:'#3b82f6'},
];
interface Store { game: GameState; lastRoll?: YutResult; rolling: boolean; selectedPawn?: number; startGame:(count:number, ai:boolean, difficulty:Difficulty)=>void; throwYut:()=>void; selectPawn:(id:number)=>void; applySelected:(move:MoveOption)=>void; aiStep:()=>void; moves:()=>MoveOption[]; }
const loadGame = (): GameState | undefined => { try { const raw=localStorage.getItem('yutGame'); return raw ? JSON.parse(raw) as GameState : undefined; } catch { return undefined; } };
const saveGame = (game:GameState) => { try { localStorage.setItem('yutGame', JSON.stringify(game)); } catch { /* noop */ } };
const buildPlayers = (count:number, ai:boolean, difficulty:Difficulty): PlayerState[] => Array.from({length:count},(_,i)=>({id:i as PlayerId,name: ai && i===count-1?'컴퓨터':`가족 ${i+1}`,isAi:ai && i===count-1,difficulty:ai && i===count-1?difficulty:undefined,color:['#ef4444','#3b82f6','#22c55e','#a855f7'][i]}));
export const useGameStore = create<Store>((set,get)=>({
  game: loadGame() ?? createInitialGame(defaultPlayers), rolling:false,
  startGame:(count, ai, difficulty)=>{const game=createInitialGame(buildPlayers(count,ai,difficulty)); saveGame(game); set({game,lastRoll:undefined,selectedPawn:undefined});},
  throwYut:()=>{ if(get().rolling || get().game.winner!==undefined) return; set({rolling:true}); window.setTimeout(()=>{ const result=randomRoll(); const game=applyRoll(get().game,result); saveGame(game); set({game,lastRoll:result,rolling:false}); get().aiStep(); }, 450); },
  selectPawn:(id)=>{const game=get().game; const move=legalMoves(game).find(m=>m.pawnId===id); if(!move){set({game:{...game,message:'괜찮아요! 지금 움직일 수 있는 말을 노란 길로 표시했어요.'}}); return;} get().applySelected(move);},
  applySelected:(move)=>{const game=applyMove(get().game,move); saveGame(game); set({game,selectedPawn:move.pawnId}); window.setTimeout(()=>get().aiStep(),350);},
  aiStep:()=>{const {game}=get(); const player=game.players.find(p=>p.id===game.currentPlayer); if(!player?.isAi || game.winner!==undefined) return; window.setTimeout(()=>{let s=get().game; if(!s.pendingRolls.length) { const r=randomRoll(); s=applyRoll(s,r); set({game:s,lastRoll:r}); saveGame(s); } const decision=chooseMove(s,player.difficulty ?? 'normal'); if(decision.move) { s=applyMove(s,decision.move); set({game:s}); saveGame(s); if(s.players.find(p=>p.id===s.currentPlayer)?.isAi && !s.winner) get().aiStep(); }},650);},
  moves:()=>legalMoves(get().game),
}));
export const selectAvailableMovesForPawn = (moves:MoveOption[], pawnId?:number) => pawnId===undefined ? moves : moves.filter(m=>m.pawnId===pawnId);
