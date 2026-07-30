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

const FLAT_STYLE = {
  background: 'linear-gradient(160deg,#f8e9c9,#e7c489 55%,#d4a860)',
  boxShadow: 'inset 0 2px 4px rgba(255,255,255,.6), inset 0 -3px 5px rgba(0,0,0,.22), 0 9px 12px rgba(0,0,0,.3)',
  border: '2px solid #6b3d14',
};
const BACK_STYLE = {
  background: 'linear-gradient(160deg,#a2622e,#7a4517 65%,#5e3410)',
  boxShadow: 'inset 0 2px 3px rgba(255,255,255,.25), inset 0 -3px 5px rgba(0,0,0,.35), 0 9px 12px rgba(0,0,0,.3)',
  border: '2px solid #4a2a0c',
};

export function YutSticks({ result, rolling, canThrow, throwsLeft, pendingRolls, onThrow }: Props) {
  const faces = result?.faces?.length === 4 ? result.faces : [false, false, false, false];
  return <section className="panel rounded-3xl p-4" aria-label="윷 던지기">
    <div className="mb-3 flex justify-center gap-2.5 [perspective:600px]" aria-live="polite">
      {faces.map((flat, i) => (
        <motion.div key={i}
          animate={rolling ? { rotateX: [0, 540, 1080], y: [0, -26, 0] } : { rotateX: flat ? 0 : 180, y: 0 }}
          transition={{ duration: 0.65, delay: i * 0.07 }}
          className="grid h-24 w-9 place-items-center rounded-full [transform-style:preserve-3d]"
          style={flat ? FLAT_STYLE : BACK_STYLE}>
          {/* 0번 가락은 백도 표식(✕) */}
          <span className={`text-xl ${flat ? 'text-rose-700' : 'text-amber-100/30'}`} aria-hidden>
            {i === 0 ? '✕' : flat ? '⁝' : ''}
          </span>
          <span className="sr-only">{flat ? '배' : '등'}</span>
        </motion.div>
      ))}
    </div>
    <button onClick={onThrow} disabled={!canThrow || rolling}
      className="btn-3d min-h-14 w-full rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 px-5 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a,0_12px_18px_rgba(30,58,138,.35)] disabled:opacity-50 disabled:shadow-none">
      {rolling ? '빙글빙글 던지는 중…' : throwsLeft > 0 ? `윷 던지기 (${throwsLeft}번 남음)` : '말을 움직여 주세요'}
    </button>
    <motion.p key={rolling ? 'rolling' : result?.name ?? 'ready'}
      initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      className="mt-3 text-center text-4xl font-black text-rose-700 dark:text-rose-300"
      style={{ textShadow: '0 2px 0 rgba(255,255,255,.55)' }}>
      {rolling ? '…' : result?.name ?? '준비!'}
    </motion.p>
    {pendingRolls.length > 0 && (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5" aria-label="사용할 수 있는 윷 결과">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">쓸 수 있는 결과:</span>
        {pendingRolls.map((r, i) => (
          <span key={i} className="rounded-full bg-gradient-to-b from-amber-200 to-amber-300 px-2.5 py-1 text-sm font-black text-amber-900 shadow-[0_2px_0_#b45309]">
            {r.name}{r.steps > 0 ? ` +${r.steps}` : r.steps < 0 ? ' -1' : ''}
          </span>
        ))}
      </div>
    )}
  </section>;
}
