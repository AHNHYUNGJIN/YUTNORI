import { motion } from 'framer-motion';
import type { PawnState } from '../domain/types';
const palette = ['#ef4444','#3b82f6','#22c55e','#a855f7'];
export function Pawn({ pawn, x, y, selected, onSelect }:{ pawn:PawnState; x:number; y:number; selected?:boolean; onSelect?: (id:number)=>void }) {
  return <motion.g role="button" aria-label={`${pawn.playerId+1}번 선수 ${pawn.id%4+1}번 말`} tabIndex={0} onClick={()=>onSelect?.(pawn.id)} onKeyDown={e=>{if(e.key==='Enter') onSelect?.(pawn.id)}} initial={false} animate={{x:0,y:0,scale:selected?1.25:1}} transition={{type:'spring',stiffness:150,damping:16}}>
    <circle cx={x} cy={y} r="3.7" fill={palette[pawn.playerId]} stroke={selected?'#facc15':'#fff'} strokeWidth="1.4"/>
    <text x={x} y={y+1.3} textAnchor="middle" fontSize="3" fill="white" fontWeight="bold">{pawn.stack.length>1?pawn.stack.length:pawn.id%4+1}</text>
  </motion.g>;
}
