import type { BoardNode, Position } from './types';

const xy = (id:number,x:number,y:number,label:string,kind:BoardNode['kind']='edge',next:number[]=[]):BoardNode=>({id,x,y,label,kind,next});
export const BOARD_NODES: BoardNode[] = [
  xy(1,90,90,'출발','corner',[2]),xy(2,70,90,'2'),xy(3,50,90,'3'),xy(4,30,90,'4'),xy(5,10,90,'서쪽','corner',[6,21]),
  xy(6,10,70,'6'),xy(7,10,50,'7'),xy(8,10,30,'8'),xy(9,10,10,'9'),xy(10,30,10,'북쪽','corner',[11,25]),
  xy(11,50,10,'11'),xy(12,70,10,'12'),xy(13,90,10,'13'),xy(14,90,30,'14'),xy(15,90,50,'동쪽','corner',[16]),
  xy(16,90,70,'16'),xy(17,90,90,'17'),xy(18,70,90,'18'),xy(19,50,90,'19'),xy(20,30,90,'도착길','corner',[]),
  xy(21,25,75,'지름1','shortcut',[22]),xy(22,40,60,'가운데','center',[23,26]),xy(23,55,45,'지름3','shortcut',[24]),xy(24,70,30,'지름4','shortcut',[15]),
  xy(25,45,25,'지름A','shortcut',[22]),xy(26,55,65,'지름B','shortcut',[27]),xy(27,70,80,'지름C','shortcut',[20]),xy(28,50,50,'마당','center',[23,26]),
].map(n=> n.next.length ? n : ({...n,next:n.id<20 ? [n.id+1] : []}));
export const FINISH_AFTER = 20;
export const nodeById = (id:number) => BOARD_NODES.find(n=>n.id===id);
export const isBoardPosition = (p:Position): p is number => typeof p === 'number';
export const distanceToHome = (p:Position): number => {
  if (p === 'HOME') return 0; if (p === 'BASE') return 21;
  const seen = new Set<number>(); let frontier:[number,number][] = [[p,0]];
  while(frontier.length){const [id,d]=frontier.shift()!; if(id>=FINISH_AFTER) return d+1; if(seen.has(id)) continue; seen.add(id); for(const nx of nodeById(id)?.next ?? []) frontier.push([nx,d+1]);}
  return 30;
};
export const boardPathFor = (from:Position, steps:number): number[] => {
  if (from === 'HOME') return [];
  if (steps === 0) return typeof from === 'number' ? [from] : [];
  if (steps < 0) return reversePath(from, Math.abs(steps));
  let paths: number[][] = from === 'BASE' ? [[1]] : [[from as number]];
  let remaining = from === 'BASE' ? steps - 1 : steps;
  while (remaining > 0) {
    paths = paths.flatMap(path => {
      const last = path[path.length-1];
      if (last >= FINISH_AFTER) return [path];
      const nexts = nodeById(last)?.next ?? [];
      return nexts.length ? nexts.map(n=>[...path,n]) : [path];
    });
    remaining--;
  }
  return paths.sort((a,b)=>distanceToHome(a[a.length-1])-distanceToHome(b[b.length-1]))[0] ?? [];
};
const reversePath = (from:Position, steps:number): number[] => {
  if (from === 'BASE' || from === 'HOME') return [];
  const prev = new Map<number,number[]>(); BOARD_NODES.forEach(n=>n.next.forEach(nx=>prev.set(nx,[...(prev.get(nx)??[]),n.id])));
  let current = from; const path:number[]=[];
  for(let i=0;i<steps;i++){const p=(prev.get(current as number)??[]).sort((a,b)=>b-a)[0]; if(!p) break; current=p; path.push(p);} return path;
};
export const destinationFromPath = (path:number[]): Position => path.length === 0 ? 'BASE' : path[path.length-1] >= FINISH_AFTER ? 'HOME' : path[path.length-1];
