import { motion } from 'framer-motion';
import type { YutResult } from '../domain/types';
export function YutSticks({ result, rolling, onThrow }:{ result?:YutResult; rolling:boolean; onThrow:()=>void }) {
  const sticks = result?.faces ?? [false,false,false,false];
  return <section className="rounded-3xl bg-white p-4 shadow-lg dark:bg-slate-800" aria-label="윷 던지기">
    <div className="mb-3 flex justify-center gap-2" aria-live="polite">
      {sticks.map((back,i)=><motion.div key={i} animate={rolling?{rotate:[0,180,360],y:[0,-18,0]}:{rotate:back?180:0,y:0}} transition={{duration:.65,delay:i*.05}} className={`h-20 w-8 rounded-full border-2 ${back?'bg-blue-200 border-blue-600':'bg-amber-200 border-amber-700'} shadow-inner`}><span className="sr-only">{back?'등':'배'}</span></motion.div>)}
    </div>
    <button onClick={onThrow} disabled={rolling} className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-3 text-xl font-black text-white shadow-lg active:scale-95 disabled:opacity-60">{rolling?'빙글빙글 던지는 중':'손가락으로 윷 던지기'}</button>
    <p className="mt-2 text-center text-2xl font-black text-rose-600 dark:text-rose-300">{result?.name ?? '준비!'}</p>
  </section>;
}
