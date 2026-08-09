import { create } from 'zustand';
import { chooseMove } from '../ai/strategy';
import { playSfx } from '../audio/sfx';
import {
  applyMove, applyRoll, createInitialGame, endTurnIfStuck, legalMoves, randomRoll,
} from '../domain/yutnori-rules';
import type { Difficulty, GameState, MoveOption, PlayerId, PlayerState, Position, YutResult } from '../domain/types';

const SAVE_KEY = 'yutGame.v2';
const PALETTE = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];
const defaultPlayers: PlayerState[] = [
  { id: 0, name: '가족 1', isAi: false, color: PALETTE[0] },
  { id: 1, name: '컴퓨터', isAi: true, difficulty: 'normal', color: PALETTE[1] },
];

interface Store {
  game: GameState;
  lastRoll?: YutResult;
  rolling: boolean;
  selectedPawn?: number;
  startGame: (count: number, ai: boolean, difficulty: Difficulty) => void;
  throwYut: () => void;
  selectPawn: (id: number) => void;
  selectDestination: (to: Position) => void;
  applySelected: (move: MoveOption) => void;
  settle: () => void;
  aiStep: () => void;
  moves: () => MoveOption[];
}

const loadGame = (): GameState | undefined => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return undefined;
    const game = JSON.parse(raw) as GameState;
    const valid = typeof game.throwsLeft === 'number'
      && Array.isArray(game.pawns)
      && game.pawns.every((p) => Array.isArray(p.track));
    return valid ? game : undefined;
  } catch { return undefined; }
};
const saveGame = (game: GameState) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch { /* noop */ } };

const buildPlayers = (count: number, ai: boolean, difficulty: Difficulty): PlayerState[] =>
  Array.from({ length: count }, (_, i) => {
    const isAi = ai && i === count - 1;
    return {
      id: i as PlayerId,
      name: isAi ? '컴퓨터' : `가족 ${i + 1}`,
      isAi,
      difficulty: isAi ? difficulty : undefined,
      color: PALETTE[i],
    };
  });

const isAiTurn = (game: GameState) => game.players.find((p) => p.id === game.currentPlayer)?.isAi === true;

export const useGameStore = create<Store>((set, get) => ({
  game: loadGame() ?? createInitialGame(defaultPlayers),
  rolling: false,

  startGame: (count, ai, difficulty) => {
    const game = createInitialGame(buildPlayers(count, ai, difficulty));
    saveGame(game);
    set({ game, lastRoll: undefined, selectedPawn: undefined, rolling: false });
  },

  throwYut: () => {
    const { rolling, game } = get();
    if (rolling || game.winner !== undefined || game.throwsLeft <= 0 || isAiTurn(game)) return;
    playSfx('throw');
    set({ rolling: true, selectedPawn: undefined });
    window.setTimeout(() => {
      const result = randomRoll();
      const next = applyRoll(get().game, result);
      saveGame(next);
      set({ game: next, lastRoll: result, rolling: false });
      playSfx(result.name === '낙' ? 'nak' : 'roll');
      get().settle();
    }, 550);
  },

  selectPawn: (id) => {
    const { game } = get();
    if (isAiTurn(game) || game.winner !== undefined) return;
    const pawn = game.pawns.find((p) => p.id === id);
    if (!pawn) return;
    // 업힌 말이나 같은 대기줄의 말을 눌러도 대표 말의 수를 찾는다
    const options = legalMoves(game).filter((m) => {
      if (m.pawnId === id || m.carries.includes(id)) return true;
      const moverPos = game.pawns.find((p) => p.id === m.pawnId)?.position;
      return pawn.position === 'BASE' && moverPos === 'BASE' && pawn.playerId === game.currentPlayer;
    });
    if (options.length === 0) {
      const hint = game.pendingRolls.length > 0
        ? '이 말은 지금 움직일 수 없어요. 반짝이는 말을 골라 보세요.'
        : '먼저 윷을 던져 주세요!';
      set({ game: { ...game, message: hint } });
      return;
    }
    playSfx('select');
    const leaderId = options[0].pawnId;
    // 같은 말을 다시 누르면 선택 취소
    if (get().selectedPawn === leaderId) {
      set({ selectedPawn: undefined, game: { ...game, message: '선택을 취소했어요. 움직일 말을 골라 주세요.' } });
      return;
    }
    const hint = options.length > 1 ? '노란 도착 칸을 눌러 이동할 곳을 고르세요.' : '노란 도착 칸을 눌러 이동을 확정하세요.';
    set({ selectedPawn: leaderId, game: { ...game, message: hint } });
  },

  selectDestination: (to) => {
    const { selectedPawn, game } = get();
    if (selectedPawn === undefined) return;
    const option = legalMoves(game).find((m) => m.pawnId === selectedPawn && String(m.to) === String(to));
    if (option) get().applySelected(option);
  },

  applySelected: (move) => {
    const game = applyMove(get().game, move);
    saveGame(game);
    set({ game, selectedPawn: undefined });
    playSfx(game.winner !== undefined ? 'win' : move.captures.length > 0 ? 'capture' : move.to === 'HOME' ? 'home' : 'move');
    get().settle();
  },

  // 상태가 바뀔 때마다: 막힌 턴을 자동으로 넘기고, AI 차례면 AI를 굴린다
  settle: () => {
    window.setTimeout(() => {
      let game = get().game;
      if (game.winner !== undefined) return;
      const unstuck = endTurnIfStuck(game);
      if (unstuck !== game) {
        saveGame(unstuck);
        set({ game: unstuck, selectedPawn: undefined });
        game = unstuck;
      }
      if (isAiTurn(game)) get().aiStep();
    }, 400);
  },

  aiStep: () => {
    const { game } = get();
    if (!isAiTurn(game) || game.winner !== undefined) return;
    window.setTimeout(() => {
      const state = get().game;
      if (!isAiTurn(state) || state.winner !== undefined) return;
      if (state.throwsLeft > 0) {
        const result = randomRoll();
        const next = applyRoll(state, result);
        saveGame(next);
        set({ game: next, lastRoll: result });
        playSfx(result.name === '낙' ? 'nak' : 'roll');
        get().settle();
        return;
      }
      const player = state.players.find((p) => p.id === state.currentPlayer)!;
      const decision = chooseMove(state, player.difficulty ?? 'normal');
      const next = decision.move ? applyMove(state, decision.move) : endTurnIfStuck(state);
      saveGame(next);
      set({ game: next });
      if (decision.move) {
        playSfx(next.winner !== undefined ? 'win' : decision.move.captures.length > 0 ? 'capture' : decision.move.to === 'HOME' ? 'home' : 'move');
      }
      get().settle();
    }, 700);
  },

  moves: () => legalMoves(get().game),
}));

export const selectAvailableMovesForPawn = (moves: MoveOption[], pawnId?: number) =>
  pawnId === undefined ? moves : moves.filter((m) => m.pawnId === pawnId);
