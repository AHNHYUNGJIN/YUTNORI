import { distanceToHome, forwardPath } from '../domain/board';
import {
  applyMove, applyRoll, createInitialGame, endTurnIfStuck, legalMoves, randomRoll, resultFromSteps,
} from '../domain/yutnori-rules';
import type { Difficulty, GameState, MoveOption, PlayerId, PlayerState, Position } from '../domain/types';

export interface AiDecision { move?: MoveOption; reason: string; }

// 윷가락 4개(등/배 1/2 확률, 0번은 백도 표식)의 결과 분포
const ROLL_DIST: Array<{ steps: number; p: number }> = [
  { steps: -1, p: 1 / 16 }, { steps: 1, p: 3 / 16 }, { steps: 2, p: 6 / 16 },
  { steps: 3, p: 4 / 16 }, { steps: 4, p: 1 / 16 }, { steps: 5, p: 1 / 16 },
];

/** pos에 서 있을 때 상대가 다음 던지기 한 번으로 잡을 확률(근사) */
export const threatAt = (state: GameState, pos: Position, playerId: PlayerId): number => {
  if (typeof pos !== 'number') return 0;
  let threat = 0;
  const seen = new Set<string>();
  for (const enemy of state.pawns) {
    if (enemy.playerId === playerId || enemy.position === 'HOME') continue;
    const key = `${enemy.playerId}:${String(enemy.position)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const { steps, p } of ROLL_DIST) {
      if (steps < 0) continue;
      const fwd = forwardPath(enemy.position, steps);
      if (fwd && fwd.to === pos) threat += p;
    }
  }
  return Math.min(1, threat);
};

export const evaluateMove = (state: GameState, m: MoveOption): number => {
  const me = state.pawns.find((p) => p.id === m.pawnId)!.playerId;
  const group = m.carries.length;
  let v = 0;
  v += m.captures.length * 42 + (m.captures.length > 0 ? 14 : 0); // 잡기 + 보너스 던지기 가치
  if (m.to === 'HOME') v += 46 + group * 26;
  v += (distanceToHome(m.from) - distanceToHome(m.to)) * 2.2 * group;
  if (m.to === 5 || m.to === 10) v += 7; // 지름길 입구 선점
  if (m.to === 22) v += 5;
  const friends = typeof m.to === 'number'
    ? state.pawns.filter((p) => p.playerId === me && p.position === m.to && !m.carries.includes(p.id)).length
    : 0;
  if (friends > 0) v += 9; // 업기
  const danger = threatAt(state, m.to, me);
  v -= danger * (16 + 10 * (group + friends));
  v += threatAt(state, m.from, me) * 6 * group; // 위험한 자리 탈출
  return v;
};

/** 어려움: 수를 둔 뒤 상대의 기대 반격 가치까지 감안 */
const lookahead = (state: GameState, m: MoveOption): number => {
  const me = state.currentPlayer;
  const after = applyMove(state, m);
  if (after.winner === me) return 500;
  if (after.currentPlayer === me) return 4; // 턴 유지(윷·모·잡기) 보너스
  let ev = 0;
  for (const { steps, p } of ROLL_DIST) {
    const rolled = applyRoll({ ...after, throwsLeft: Math.max(1, after.throwsLeft) }, resultFromSteps(steps));
    const options = legalMoves(rolled);
    if (options.length === 0) continue;
    ev += p * Math.max(...options.map((o) => evaluateMove(rolled, o)));
  }
  return -ev * 0.5;
};

export const chooseMove = (state: GameState, difficulty: Difficulty = 'normal', rng = Math.random): AiDecision => {
  const moves = legalMoves(state);
  if (!moves.length) return { reason: '움직일 수 있는 말이 없어요.' };
  if (difficulty === 'easy') return { move: moves[Math.floor(rng() * moves.length)], reason: '쉬움: 아무 말이나 골랐어요.' };
  const scored = moves
    .map((m) => ({ m, v: evaluateMove(state, m) + (difficulty === 'hard' ? lookahead(state, m) : 0) }))
    .sort((a, b) => b.v - a.v);
  return {
    move: scored[0].m,
    reason: difficulty === 'hard' ? '어려움: 상대의 반격까지 계산했어요.' : '보통: 잡기와 전진을 먼저 봤어요.',
  };
};

export const evaluateState = (state: GameState, player: PlayerId): number => {
  const worth = (pos: Position) => (pos === 'HOME' ? 40 : 22 - distanceToHome(pos));
  const mine = state.pawns.filter((p) => p.playerId === player).reduce((s, p) => s + worth(p.position), 0);
  const others = state.pawns.filter((p) => p.playerId !== player).reduce((s, p) => s + worth(p.position), 0);
  return mine - others / Math.max(1, state.players.length - 1);
};

export const seededRng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

export const simulateGame = (players: PlayerState[], strategies: Record<number, Difficulty>, seed = 1, maxTurns = 700): GameState => {
  const rng = seededRng(seed);
  let state = createInitialGame(players);
  for (let guard = 0; guard < maxTurns * 8 && state.winner === undefined && state.turnCount < maxTurns; guard += 1) {
    if (state.throwsLeft > 0) { state = applyRoll(state, randomRoll(rng)); continue; }
    if (state.pendingRolls.length > 0) {
      const decision = chooseMove(state, strategies[state.currentPlayer] ?? 'normal', rng);
      state = decision.move ? applyMove(state, decision.move) : endTurnIfStuck(state);
      continue;
    }
    state = endTurnIfStuck(state);
  }
  if (state.winner === undefined) {
    const leader = [...state.players].sort((a, b) => evaluateState(state, b.id) - evaluateState(state, a.id))[0];
    state = { ...state, winner: leader.id, message: '턴 제한 판정승' };
  }
  return state;
};

export const runAiTournament = (games = 100) => {
  const players: PlayerState[] = [
    { id: 0, name: '어려움', isAi: true, difficulty: 'hard', color: '#e11d48' },
    { id: 1, name: '쉬움', isAi: true, difficulty: 'easy', color: '#16a34a' },
  ];
  const wins = { hard: 0, normal: 0, easy: 0 };
  for (let i = 0; i < games; i += 1) {
    const hardVsEasy = simulateGame(players, { 0: 'hard', 1: 'easy' }, i + 3);
    if (hardVsEasy.winner === 0) wins.hard += 1; else wins.easy += 1;
    const normalVsEasy = simulateGame([{ ...players[0], name: '보통', difficulty: 'normal' }, { ...players[1] }], { 0: 'normal', 1: 'easy' }, i + 1003);
    if (normalVsEasy.winner === 0) wins.normal += 1; else wins.easy += 1;
  }
  return {
    hard: Math.round((wins.hard / games) * 100),
    normal: Math.round((wins.normal / games) * 100),
    easy: Math.round((wins.easy / (games * 2)) * 100),
  };
};
