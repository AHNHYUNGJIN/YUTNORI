import { motion } from 'framer-motion';
import type { YutResult } from '../domain/types';

interface Props {
  result?: YutResult;
  rolling: boolean;
  canThrow: boolean;
  throwsLeft: number;
  pendingRolls: YutResult[];
  onThrow: () => void;
}

export function YutSticks({ result, rolling, canThrow, throwsLeft, pendingRolls, onThrow }: Props) {
  const faces = result?.faces?.length === 4 ? result.faces : [false, false, false, false];
  return <section className="rounded-3xl bg-white p-4 shadow-lg dark:bg-slate-800" aria-label="윷 던지기">
    <div className="mb-3 flex justify-center gap-2" aria-live="polite">
      {faces.map((flat, i) => (
        <motion.div key={i}
          animate={rolling ? { rotateX: [0, 540, 1080], y: [0, -22, 0] } : { rotateX: flat ? 0 : 180, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.06 }}
          className={`grid h-20 w-8 place-items-center rounded-full border-2 shadow-inner ${flat ? 'border-amber-700 bg-amber-100' : 'border-amber-900 bg-amber-600'}`}>
          {/* 0번 가락은 백도 표식(✕) */}
          <span className={`text-lg font-black ${flat ? 'text-rose-600' : 'text-amber-900/40'}`} aria-hidden>
            {i === 0 ? '✕' : flat ? '⋮' : ''}
          </span>
          <span className="sr-only">{flat ? '배' : '등'}</span>
        </motion.div>
      ))}
    </div>
    <button onClick={onThrow} disabled={!canThrow || rolling}
      className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-3 text-xl font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50">
      {rolling ? '빙글빙글 던지는 중…' : throwsLeft > 0 ? `윷 던지기 (${throwsLeft}번 남음)` : '말을 움직여 주세요'}
    </button>
    <p className="mt-2 text-center text-3xl font-black text-rose-600 dark:text-rose-300">{rolling ? '…' : result?.name ?? '준비!'}</p>
    {pendingRolls.length > 0 && (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5" aria-label="사용할 수 있는 윷 결과">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-300">쓸 수 있는 결과:</span>
        {pendingRolls.map((r, i) => (
          <span key={i} className="rounded-full bg-amber-200 px-2.5 py-1 text-sm font-black text-amber-900">
            {r.name}{r.steps > 0 ? ` +${r.steps}` : r.steps < 0 ? ' -1' : ''}
          </span>
        ))}
      </div>
    )}
  </section>;
}
