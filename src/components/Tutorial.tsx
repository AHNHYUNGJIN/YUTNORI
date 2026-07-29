import { useState } from 'react';

const steps = [
  '윷 4개를 던져요. 배(평평한 면)가 1개면 도, 2개면 개, 3개면 걸, 4개면 윷, 0개면 모!',
  '윷(4칸)이나 모(5칸)가 나오면 한 번 더 던질 수 있어요. ✕ 표식 가락 하나만 뒤집히면 백도 — 한 칸 뒤로!',
  '점수판의 대기 말이나 판 위의 말을 누르고, 노란 칸을 눌러 이동해요. 모서리나 방(가운데)에 딱 멈추면 지름길!',
  '상대 말을 잡으면 상대는 처음부터 다시, 나는 한 번 더 던져요. 같은 칸의 내 말은 업고 함께 달려요.',
  '출발점을 지나 말 4개가 모두 나오면 승리! 즐겁게 응원해요 🎉',
];

export function Tutorial() {
  const [open, setOpen] = useState(() => localStorage.getItem('tutorialDone') !== 'yes');
  const [i, setI] = useState(0);
  if (!open) return <button className="rounded-2xl bg-amber-300 px-4 py-2 font-black text-blue-950" onClick={() => setOpen(true)}>규칙 보기</button>;
  return <div role="dialog" aria-label="윷놀이 튜토리얼" className="fixed inset-0 z-20 grid place-items-center bg-slate-950/60 p-4">
    <div className="max-w-md rounded-3xl bg-white p-6 text-blue-950 shadow-2xl">
      <h2 className="text-2xl font-black">배우며 놀기 {i + 1}/{steps.length}</h2>
      <p className="my-5 text-xl font-bold leading-relaxed">{steps[i]}</p>
      <div className="flex gap-2">
        <button className="flex-1 rounded-2xl bg-slate-200 p-3 font-bold" onClick={() => setI(Math.max(0, i - 1))}>이전</button>
        <button className="flex-1 rounded-2xl bg-blue-600 p-3 font-black text-white"
          onClick={() => { if (i < steps.length - 1) setI(i + 1); else { localStorage.setItem('tutorialDone', 'yes'); setOpen(false); setI(0); } }}>
          {i < steps.length - 1 ? '다음' : '시작!'}
        </button>
      </div>
    </div>
  </div>;
}
