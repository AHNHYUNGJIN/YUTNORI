export type PlayerId = 0 | 1 | 2 | 3;
export type Difficulty = 'easy' | 'normal' | 'hard';
export type YutName = '낙' | '백도' | '도' | '개' | '걸' | '윷' | '모';
export type Position = 'BASE' | 'HOME' | number;
export interface YutResult { name: YutName; steps: number; extraTurn: boolean; faces: boolean[]; }
export interface PawnState {
  id: number;
  playerId: PlayerId;
  position: Position;
  stack: number[];
  /** 지나온 밭 기록 — 백도(한 칸 후진)의 정확한 경로 계산에 사용 */
  track: number[];
}
export interface PlayerState { id: PlayerId; name: string; isAi: boolean; difficulty?: Difficulty; color: string; }
export interface GameState {
  players: PlayerState[];
  pawns: PawnState[];
  currentPlayer: PlayerId;
  pendingRolls: YutResult[];
  /** 이번 차례에 남은 던지기 횟수 (윷·모·잡기로 +1) */
  throwsLeft: number;
  winner?: PlayerId;
  turnCount: number;
  message: string;
}
export interface MoveOption { pawnId: number; result: YutResult; from: Position; to: Position; path: number[]; captures: number[]; carries: number[]; score: number; }
export interface BoardNode { id: number; x: number; y: number; label: string; kind: 'start' | 'corner' | 'edge' | 'center' | 'shortcut'; }
