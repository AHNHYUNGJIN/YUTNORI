export type PlayerId = 0 | 1 | 2 | 3;
export type Difficulty = 'easy' | 'normal' | 'hard';
export type YutName = '낙' | '백도' | '도' | '개' | '걸' | '윷' | '모';
export type Position = 'BASE' | 'HOME' | number;
export interface YutResult { name: YutName; steps: number; extraTurn: boolean; faces: boolean[]; }
export interface PawnState { id: number; playerId: PlayerId; position: Position; stack: number[]; }
export interface PlayerState { id: PlayerId; name: string; isAi: boolean; difficulty?: Difficulty; color: string; }
export interface GameState { players: PlayerState[]; pawns: PawnState[]; currentPlayer: PlayerId; pendingRolls: YutResult[]; winner?: PlayerId; turnCount: number; message: string; }
export interface MoveOption { pawnId: number; result: YutResult; from: Position; to: Position; path: number[]; captures: number[]; carries: number[]; score: number; }
export interface BoardNode { id: number; x: number; y: number; label: string; kind: 'corner' | 'edge' | 'center' | 'shortcut'; next: number[]; }
