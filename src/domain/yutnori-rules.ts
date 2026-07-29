import { START, distanceToHome, forwardPath } from './board';
import type { GameState, MoveOption, PawnState, PlayerId, PlayerState, Position, YutName, YutResult } from './types';

// faces[i] = true 면 i번째 윷가락의 배(평평한 면)가 위. faces[0]은 백도 표식 가락.
export const resultFromFaces = (faces: boolean[], fallen = false): YutResult => {
  if (fallen) return { name: '낙', steps: 0, extraTurn: false, faces };
  const flats = faces.filter(Boolean).length;
  if (flats === 0) return { name: '모', steps: 5, extraTurn: true, faces };
  if (flats === 1) {
    return faces[0]
      ? { name: '백도', steps: -1, extraTurn: false, faces }
      : { name: '도', steps: 1, extraTurn: false, faces };
  }
  if (flats === 2) return { name: '개', steps: 2, extraTurn: false, faces };
  if (flats === 3) return { name: '걸', steps: 3, extraTurn: false, faces };
  return { name: '윷', steps: 4, extraTurn: true, faces };
};

export const NAK_CHANCE = 0.02;
export const randomRoll = (rng = Math.random): YutResult => {
  const faces = Array.from({ length: 4 }, () => rng() > 0.5);
  return resultFromFaces(faces, rng() < NAK_CHANCE);
};

export const resultFromSteps = (steps: number): YutResult => {
  const byName: Record<number, YutName> = { [-1]: '백도', 1: '도', 2: '개', 3: '걸', 4: '윷', 5: '모' };
  return { name: byName[steps] ?? '도', steps, extraTurn: steps >= 4, faces: [] };
};

export const createInitialGame = (players: PlayerState[]): GameState => ({
  players,
  currentPlayer: 0,
  pendingRolls: [],
  throwsLeft: 1,
  turnCount: 0,
  message: '윷을 던져 보세요!',
  pawns: players.flatMap((p) => [0, 1, 2, 3].map((i) => ({
    id: p.id * 4 + i, playerId: p.id, position: 'BASE' as Position, stack: [p.id * 4 + i], track: [],
  }))),
});

export const isFinished = (p: PawnState) => p.position === 'HOME';
export const pawnsAt = (state: GameState, pos: Position) =>
  typeof pos === 'number' ? state.pawns.filter((p) => p.position === pos) : [];

// 같은 밭에 업힌 말들·대기 말들은 어느 것을 골라도 결과가 같으므로 대표 말 하나만 후보로 삼는다.
const moveCandidates = (state: GameState, playerId: PlayerId): PawnState[] => {
  const own = state.pawns.filter((p) => p.playerId === playerId && !isFinished(p));
  const seen = new Set<string>();
  return own.filter((p) => {
    const key = String(p.position);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const legalMoves = (state: GameState, playerId = state.currentPlayer): MoveOption[] => {
  const rolls = state.pendingRolls.filter((r, i, arr) => arr.findIndex((o) => o.name === r.name) === i);
  return rolls.flatMap((result) =>
    moveCandidates(state, playerId)
      .map((pawn) => buildMove(state, pawn, result))
      .filter(Boolean) as MoveOption[]);
};

export const buildMove = (state: GameState, pawn: PawnState, result: YutResult): MoveOption | undefined => {
  if (result.name === '낙' || pawn.position === 'HOME') return undefined;
  let path: number[];
  let to: Position;
  if (result.steps < 0) {
    // 백도: 지나온 길을 한 칸 되돌아간다. 첫 밭(track 1칸)에서는 참먹이(0)로.
    if (pawn.position === 'BASE') return undefined;
    const back = pawn.track.length >= 2 ? pawn.track[pawn.track.length - 2] : pawn.position === START ? undefined : START;
    if (back === undefined) return undefined;
    path = [back];
    to = back;
  } else {
    const fwd = forwardPath(pawn.position, result.steps);
    if (!fwd) return undefined;
    path = fwd.path;
    to = fwd.to;
  }
  const captures = typeof to === 'number'
    ? pawnsAt(state, to).filter((p) => p.playerId !== pawn.playerId).map((p) => p.id)
    : [];
  const carries = [...new Set([pawn.id, ...pawnsAt(state, pawn.position).filter((p) => p.playerId === pawn.playerId).map((p) => p.id)])];
  const score = captures.length * 40
    + (to === 'HOME' ? 60 : 0)
    + (distanceToHome(pawn.position) - distanceToHome(to)) * 2
    + (result.extraTurn ? 5 : 0);
  return { pawnId: pawn.id, result, from: pawn.position, to, path, captures, carries, score };
};

export const applyRoll = (state: GameState, result: YutResult): GameState => {
  const throwsLeft = Math.max(0, state.throwsLeft - 1) + (result.extraTurn ? 1 : 0);
  if (result.name === '낙') {
    return { ...state, throwsLeft, message: '낙! 윷이 판 밖으로 떨어졌어요.' };
  }
  const hint = result.extraTurn ? '한 번 더 던질 수 있어요!' : result.steps < 0 ? '말이 한 칸 뒤로 가요.' : `${result.steps}칸 갈 수 있어요.`;
  return { ...state, throwsLeft, pendingRolls: [...state.pendingRolls, result], message: `${result.name}! ${hint}` };
};

export const applyMove = (state: GameState, move: MoveOption): GameState => {
  const used = state.pendingRolls.findIndex((r) => r === move.result || r.name === move.result.name);
  const pending = state.pendingRolls.filter((_, i) => i !== used);
  const mover = state.pawns.find((p) => p.id === move.pawnId)!;
  const nextTrack = move.to === 'HOME' ? []
    : move.result.steps < 0 ? mover.track.slice(0, -1)
    : [...mover.track, ...move.path];
  let pawns = state.pawns.map((p) => {
    if (move.captures.includes(p.id)) return { ...p, position: 'BASE' as Position, stack: [p.id], track: [] };
    if (move.carries.includes(p.id)) return { ...p, position: move.to, stack: move.carries, track: nextTrack };
    return p;
  });
  pawns = normalizeStacks(pawns);
  const winner = state.players.find((pl) => pawns.filter((p) => p.playerId === pl.id).every(isFinished))?.id;
  const throwsLeft = state.throwsLeft + (move.captures.length > 0 ? 1 : 0);
  const keepTurn = winner === undefined && (pending.length > 0 || throwsLeft > 0);
  const arrived = move.to === 'HOME' ? move.carries.length : 0;
  const message = winner !== undefined ? `${state.players[winner].name} 승리! 🎉`
    : move.captures.length > 0 ? '상대 말을 잡았어요! 한 번 더 던지세요.'
    : arrived > 0 ? `말 ${arrived}개가 도착했어요!`
    : keepTurn ? '계속 진행하세요!'
    : '다음 차례로 넘어가요.';
  const next: GameState = { ...state, pawns, pendingRolls: pending, winner, throwsLeft, turnCount: state.turnCount + 1, message };
  return keepTurn || winner !== undefined ? next : { ...next, currentPlayer: nextPlayer(state), throwsLeft: 1 };
};

/** 던질 기회도 없고 움직일 말도 없으면 차례를 넘긴다(낙, 말이 모두 대기 중인 백도 등). */
export const endTurnIfStuck = (state: GameState): GameState => {
  if (state.winner !== undefined || state.throwsLeft > 0) return state;
  if (legalMoves(state).length > 0) return state;
  return {
    ...state,
    pendingRolls: [],
    throwsLeft: 1,
    currentPlayer: nextPlayer(state),
    turnCount: state.turnCount + 1,
    message: state.pendingRolls.length > 0 ? '움직일 수 있는 말이 없어 차례를 넘겨요.' : '다음 차례로 넘어가요.',
  };
};

export const normalizeStacks = (pawns: PawnState[]): PawnState[] => pawns.map((p) => {
  if (p.position === 'BASE' || p.position === 'HOME') return { ...p, stack: [p.id] };
  const ids = pawns.filter((o) => o.playerId === p.playerId && o.position === p.position).map((o) => o.id);
  return { ...p, stack: ids };
});

export const nextPlayer = (state: GameState): PlayerId => (((state.currentPlayer + 1) % state.players.length) as PlayerId);
export const hasAnyLegalMove = (state: GameState) => legalMoves(state).length > 0;
