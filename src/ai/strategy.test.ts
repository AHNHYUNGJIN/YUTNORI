import { describe, expect, it } from 'vitest';
import { applyRoll, createInitialGame, legalMoves } from '../domain/yutnori-rules';
import type { PlayerState, YutResult } from '../domain/types';
import { chooseMove, runAiTournament, simulateGame } from './strategy';
const players: PlayerState[] = [{id:0,name:'A',isAi:true,difficulty:'hard',color:'#f00'},{id:1,name:'B',isAi:true,difficulty:'easy',color:'#00f'}];
const roll: YutResult = {name:'걸',steps:3,extraTurn:false,faces:[true,true,true,false]};
describe('AI strategy',()=>{
  it('chooses legal moves for every difficulty',()=>{const s=applyRoll(createInitialGame(players), roll);(['easy','normal','hard'] as const).forEach(d=>expect(legalMoves(s)).toContainEqual(chooseMove(s,d,()=>0).move));});
  it('simulation always terminates with a winner',()=>{const s=simulateGame(players,{0:'hard',1:'easy'},42,500);expect(s.winner).not.toBeUndefined();expect(s.turnCount).toBeLessThanOrEqual(500);});
  it('100 game harness shows calibrated difficulty win rates',()=>{const wins=runAiTournament(100);expect(wins.hard).toBeGreaterThanOrEqual(60);expect(wins.normal).toBeGreaterThanOrEqual(40);expect(wins.normal).toBeLessThanOrEqual(80);expect(wins.easy).toBeLessThanOrEqual(35);});
});
