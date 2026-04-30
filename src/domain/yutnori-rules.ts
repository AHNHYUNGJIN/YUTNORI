import { boardPathFor, destinationFromPath, distanceToHome } from './board';
import type { GameState, MoveOption, PawnState, PlayerId, PlayerState, Position, YutResult } from './types';

export const resultFromFaces = (faces:boolean[], fallen=false): YutResult => {
  if (fallen) return { name:'낙', steps:0, extraTurn:false, faces };
  const backs = faces.filter(Boolean).length;
  if (backs === 0) return { name:'모', steps:5, extraTurn:true, faces };
  if (backs === 1) return { name:'도', steps:1, extraTurn:false, faces };
  if (backs === 2) return { name:'개', steps:2, extraTurn:false, faces };
  if (backs === 3) return { name:'걸', steps:3, extraTurn:false, faces };
  return faces[0] ? { name:'백도', steps:-1, extraTurn:false, faces } : { name:'윷', steps:4, extraTurn:true, faces };
};
export const randomRoll = (rng=Math.random): YutResult => resultFromFaces(Array.from({length:4},()=>rng()>0.5), rng()<0.03);
export const createInitialGame = (players: PlayerState[]): GameState => ({ players, currentPlayer:0, pendingRolls:[], turnCount:0, message:'윷을 던져 보세요!', pawns: players.flatMap(p=>[0,1,2,3].map(i=>({id:p.id*4+i,playerId:p.id,position:'BASE' as Position,stack:[p.id*4+i]}))), });
export const isFinished = (p: PawnState) => p.position === 'HOME';
export const pawnsAt = (state:GameState, pos:Position) => state.pawns.filter(p=>p.position===pos && pos !== 'BASE' && pos !== 'HOME');
export const legalMoves = (state: GameState, playerId=state.currentPlayer): MoveOption[] => {
  const own = state.pawns.filter(p=>p.playerId===playerId && !isFinished(p));
  return state.pendingRolls.flatMap(result => own.map(pawn => buildMove(state, pawn, result)).filter(Boolean) as MoveOption[]);
};
export const buildMove = (state:GameState, pawn:PawnState, result:YutResult): MoveOption | undefined => {
  if (result.name === '낙' || pawn.position === 'HOME') return undefined;
  const path = boardPathFor(pawn.position, result.steps);
  const to = result.steps === 0 ? pawn.position : destinationFromPath(path);
  const captures = pawnsAt(state,to).filter(p=>p.playerId!==pawn.playerId).flatMap(p=>p.stack.length?p.stack:[p.id]);
  const carries = pawnsAt(state,pawn.position).filter(p=>p.playerId===pawn.playerId).flatMap(p=>p.stack.length?p.stack:[p.id]);
  const score = (captures.length*40) + (result.extraTurn?10:0) + Math.max(0, 25-distanceToHome(to)) + (path.some(n=>n>=21)?8:0) + (carries.length>1?5:0);
  return { pawnId:pawn.id, result, from:pawn.position, to, path, captures, carries:[...new Set([pawn.id,...carries])], score };
};
export const applyRoll = (state:GameState, result:YutResult): GameState => ({ ...state, pendingRolls:[...state.pendingRolls,result], message:`${result.name}! ${result.extraTurn?'한 번 더 던져요.':'말을 움직여요.'}` });
export const applyMove = (state:GameState, move:MoveOption): GameState => {
  const used = state.pendingRolls.findIndex(r=>r===move.result || (r.name===move.result.name && r.steps===move.result.steps));
  let pending = state.pendingRolls.filter((_,i)=>i!==used);
  let pawns = state.pawns.map(p=> {
    if (move.captures.includes(p.id)) return {...p, position:'BASE' as Position, stack:[p.id]};
    if (move.carries.includes(p.id)) return {...p, position:move.to, stack:move.carries};
    return p;
  });
  pawns = normalizeStacks(pawns);
  const winner = state.players.find(pl=>pawns.filter(p=>p.playerId===pl.id).every(p=>p.position==='HOME'))?.id;
  const keepTurn = move.result.extraTurn || move.captures.length>0 || pending.length>0;
  return { ...state, pawns, pendingRolls:pending, winner, currentPlayer: keepTurn ? state.currentPlayer : nextPlayer(state), turnCount: state.turnCount+1, message: winner!==undefined ? `${state.players[winner].name} 승리!` : (keepTurn?'계속 진행해요!':'다음 차례입니다.') };
};
export const normalizeStacks = (pawns:PawnState[]): PawnState[] => pawns.map(p=> {
  if (p.position==='BASE' || p.position==='HOME') return {...p, stack:[p.id]};
  const ids = pawns.filter(o=>o.playerId===p.playerId && o.position===p.position).map(o=>o.id);
  return {...p, stack:ids};
});
export const nextPlayer = (state:GameState): PlayerId => (((state.currentPlayer + 1) % state.players.length) as PlayerId);
export const hasAnyLegalMove = (state:GameState) => legalMoves(state).length > 0;
