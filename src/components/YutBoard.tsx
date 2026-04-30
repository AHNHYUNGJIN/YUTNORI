import { motion } from 'framer-motion';
import { BOARD_NODES } from '../domain/board';
import type { MoveOption, PawnState } from '../domain/types';
import { Pawn } from './Pawn';

interface Props { pawns: PawnState[]; highlighted?: MoveOption[]; selectedPawn?: number; onPawnSelect?: (id:number)=>void; }
export function YutBoard({ pawns, highlighted = [], selectedPawn, onPawnSelect }: Props) {
  const highlightIds = new Set(highlighted.flatMap(m=>m.path));
  const posOf = (id:number) => BOARD_NODES.find(n=>n.id===id)!;
  return <section className="rounded-3xl bg-amber-50 p-3 shadow-xl ring-4 ring-amber-200 dark:bg-slate-800 dark:ring-slate-600" aria-label="윷판">
    <svg viewBox="0 0 100 100" className="mx-auto aspect-square w-full max-w-[620px]" role="img" aria-label="전통 윷놀이 판">
      <defs><filter id="soft"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity=".25"/></filter></defs>
      {BOARD_NODES.flatMap(n=>n.next.map(nx=>{const to=posOf(nx);return <line key={`${n.id}-${nx}`} x1={n.x} y1={n.y} x2={to.x} y2={to.y} className="stroke-amber-700/60 dark:stroke-amber-300/60" strokeWidth="1.4" strokeLinecap="round"/>}))}
      {BOARD_NODES.map(n=><motion.g key={n.id} initial={{scale:.7,opacity:.2}} animate={{scale:highlightIds.has(n.id)?1.25:1,opacity:1}}>
        <circle cx={n.x} cy={n.y} r={n.kind==='corner'||n.kind==='center'?4.2:3.1} className={highlightIds.has(n.id)?'fill-yellow-300 stroke-blue-600':'fill-white stroke-amber-700 dark:fill-slate-900 dark:stroke-amber-300'} strokeWidth="1.2" filter="url(#soft)"/>
        <text x={n.x} y={n.y+1.2} textAnchor="middle" fontSize="2.6" className="fill-blue-950 dark:fill-blue-100">{n.label}</text>
      </motion.g>)}
      {pawns.filter(p=>typeof p.position==='number').map((p,i)=>{const n=posOf(p.position as number); return <Pawn key={p.id} pawn={p} x={n.x + (i%2)*3-1.5} y={n.y + (Math.floor(i/2)%2)*3-1.5} selected={selectedPawn===p.id} onSelect={onPawnSelect}/>})}
    </svg>
    <div className="grid grid-cols-2 gap-2 text-sm font-bold text-blue-950 dark:text-blue-50"><span>대기 말: {pawns.filter(p=>p.position==='BASE').length}</span><span>도착 말: {pawns.filter(p=>p.position==='HOME').length}</span></div>
  </section>;
}
