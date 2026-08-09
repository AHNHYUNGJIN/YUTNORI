import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import type { YutResult } from '../domain/types';

interface Props {
  result?: YutResult;
  rolling: boolean;
  canThrow: boolean;
  throwsLeft: number;
  pendingRolls: YutResult[];
  onThrow: () => void;
}

const FLAT_STYLE = {
  background: 'linear-gradient(160deg,#f8e9c9,#e7c489 55%,#d4a860)',
  boxShadow: 'inset 0 2px 4px rgba(255,255,255,.6), inset 0 -3px 5px rgba(0,0,0,.22), 0 9px 12px rgba(0,0,0,.35)',
  border: '2px solid #6b3d14',
};
const BACK_STYLE = {
  background: 'linear-gradient(160deg,#c98a4b,#96591f 60%,#6e3f13)',
  boxShadow: 'inset 0 2px 3px rgba(255,255,255,.35), inset 0 -3px 5px rgba(0,0,0,.35), 0 9px 12px rgba(0,0,0,.35)',
  border: '2px solid #3f2409',
};

export function YutSticks({ result, rolling, canThrow, throwsLeft, pendingRolls, onThrow }: Props) {
  const faces = result?.faces?.length === 4 ? result.faces : [false, false, false, false];
  const resultLabel = rolling ? '…' : result?.name ?? '준비';
  return <section className="panel rounded-3xl p-4" aria-label="윷 던지기">
    {/* 멍석(매트) 위의 윷가락 */}
    <div className="relative rounded-2xl bg-[radial-gradient(circle_at_50%_15%,#b45309,#7c2d12_60%,#57200c)] p-4 pb-10 shadow-[inset_0_4px_14px_rgba(0,0,0,.45)] ring-1 ring-black/25">
      <div className="flex justify-center gap-2.5 [perspective:600px]" aria-live="polite">
        {faces.map((flat, i) => (
          <motion.div key={i}
            animate={rolling ? { rotateX: [0, 540, 1080], y: [0, -28, 0] } : { rotateX: flat ? 0 : 180, y: 0 }}
            transition={{ duration: 0.65, delay: i * 0.07 }}
            className="grid h-24 w-9 place-items-center rounded-full [transform-style:preserve-3d]"
            style={flat ? FLAT_STYLE : BACK_STYLE}>
            {/* 0번 가락은 백도 표식(✕) */}
            <span className={`text-xl font-black ${flat ? 'text-rose-700' : 'text-amber-100/30'}`} aria-hidden>
              {i === 0 ? '✕' : flat ? '⁝' : ''}
            </span>
            <span className="sr-only">{flat ? '배' : '등'}</span>
          </motion.div>
        ))}
      </div>
      {/* 결과 스탬프 */}
      <div className="absolute inset-x-0 -bottom-7 flex justify-center">
        <motion.div key={resultLabel}
          initial={{ scale: 0.3, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 15 }}
          className="grid h-16 min-w-16 place-items-center rounded-full bg-gradient-to-b from-amber-50 to-amber-300 px-3 shadow-[0_8px_16px_rgba(0,0,0,.35)] ring-4 ring-amber-500">
          <span className={`font-display leading-none text-rose-800 ${resultLabel.length > 1 ? 'text-2xl' : 'text-3xl'}`}>{resultLabel}</span>
        </motion.div>
      </div>
    </div>

    <button onClick={onThrow} disabled={!canThrow || rolling}
      className="btn-3d mt-10 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 px-5 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a,0_12px_18px_rgba(30,58,138,.35)] disabled:opacity-50 disabled:shadow-none">
      <Dices className="h-6 w-6" aria-hidden />
      {rolling ? '빙글빙글 던지는 중…' : throwsLeft > 0 ? `윷 던지기 (${throwsLeft}번 남음)` : '말을 움직여 주세요'}
    </button>

    {pendingRolls.length > 0 && (
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="사용할 수 있는 윷 결과">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">쓸 수 있는 결과</span>
        {pendingRolls.map((r, i) => (
          <span key={i} className="font-display rounded-full bg-gradient-to-b from-amber-200 to-amber-300 px-3 py-1 text-base text-amber-900 shadow-[0_2px_0_#b45309]">
            {r.name}{r.steps > 0 ? ` +${r.steps}` : r.steps < 0 ? ' -1' : ''}
          </span>
        ))}
      </div>
    )}
  </section>;
}
