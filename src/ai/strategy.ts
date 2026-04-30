import { applyMove, applyRoll, createInitialGame, legalMoves, randomRoll } from '../domain/yutnori-rules';
import { distanceToHome } from '../domain/board';
import type { Difficulty, GameState, MoveOption, PlayerId, PlayerState, YutResult } from '../domain/types';

export interface AiDecision { move?: MoveOption; reason: string; }
export const chooseMove = (state: GameState, difficulty: Difficulty = 'normal', rng = Math.random): AiDecision => {
  const moves = legalMoves(state);
  if (!moves.length) return { reason: '움직일 수 있는 말이 없어요.' };
  if (difficulty === 'easy') return { move: moves[Math.floor(rng() * moves.length)], reason: '쉬움: 무작위로 골랐어요.' };
  if (difficulty === 'normal') return { move: heuristicBest(moves), reason: '보통: 잡기와 지름길을 먼저 봤어요.' };
  return { move: minimaxBest(state, 3), reason: '어려움: 몇 수 앞을 생각했어요.' };
};
export const heuristicBest = (moves: MoveOption[]) => [...moves].sort((a,b)=>evaluateMove(b)-evaluateMove(a))[0];
export const evaluateMove = (m: MoveOption) => m.score + (m.to === 'HOME' ? 80 : 0) + (typeof m.to === 'number' ? Math.max(0, 30-distanceToHome(m.to)) : 0);
export const minimaxBest = (state: GameState, depth = 2): MoveOption => {
  const player = state.currentPlayer;
  return legalMoves(state).map(move=>({move, value:minimax(applyMove(state, move), depth-1, player, false)})).sort((a,b)=>b.value-a.value)[0].move;
};
const minimax = (state: GameState, depth:number, player:PlayerId, maximizing:boolean): number => {
  if (state.winner !== undefined) return state.winner === player ? 10000 : -10000;
  if (depth <= 0) return evaluateState(state, player);
  const moves = legalMoves(state);
  if (!moves.length) return evaluateState(state, player);
  const values = moves.slice(0,8).map((m) => {
    const child = applyMove(state, m);
    return minimax(child, depth - 1, player, child.currentPlayer === player);
  });
  return maximizing ? Math.max(...values) : Math.min(...values);
};
export const evaluateState = (state:GameState, player:PlayerId): number => {
  const mine = state.pawns.filter(p=>p.playerId===player).reduce((s,p)=>s+(p.position==='HOME'?120:30-distanceToHome(p.position)),0);
  const others = state.pawns.filter(p=>p.playerId!==player).reduce((s,p)=>s+(p.position==='HOME'?120:30-distanceToHome(p.position)),0);
  return mine - others/state.players.length;
};
export const seededRng = (seed:number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const simulateGame = (players: PlayerState[], strategies: Record<number,Difficulty>, seed=1, maxTurns=700): GameState => {
  const rng = seededRng(seed); let state = createInitialGame(players);
  for (let guard=0; guard<maxTurns && state.winner===undefined; guard++) {
    const result: YutResult = randomRoll(rng); state = applyRoll(state, result);
    if (result.extraTurn && rng() > 0.35) { state = applyRoll(state, randomRoll(rng)); }
    while (state.pendingRolls.length && state.winner===undefined) {
      const decision = chooseMove(state, strategies[state.currentPlayer] ?? 'normal', rng);
      if (!decision.move) { state = { ...state, pendingRolls: [], currentPlayer: ((state.currentPlayer+1)%state.players.length) as PlayerId, turnCount: state.turnCount+1 }; break; }
      state = applyMove(state, decision.move);
    }
  }
  if (state.winner === undefined) {
    const leader = [...state.players].sort((a,b)=>evaluateState(state,b.id)-evaluateState(state,a.id))[0];
    state = { ...state, winner: leader.id, message: '턴 제한 판정승' };
  }
  return state;
};
export const runAiTournament = (games=100) => {
  const players: PlayerState[] = [
    {id:0,name:'어려움',isAi:true,difficulty:'hard',color:'#e11d48'},
    {id:1,name:'쉬움',isAi:true,difficulty:'easy',color:'#16a34a'},
  ];
  const wins = { hard:0, normal:0, easy:0 };
  for(let i=0;i<games;i++){
    const hardVsEasy = simulateGame(players,{0:'hard',1:'easy'},i+3);
    if(hardVsEasy.winner===0) wins.hard++; else wins.easy++;
    const normalVsEasy = simulateGame([{...players[0],name:'보통',difficulty:'normal'},{...players[1]}],{0:'normal',1:'easy'},i+1003);
    if(normalVsEasy.winner===0) wins.normal++; else wins.easy++;
  }
  return { hard: Math.round((wins.hard / games) * 100), normal: Math.round((wins.normal / games) * 100), easy: Math.round((wins.easy / (games * 2)) * 100) };
};
