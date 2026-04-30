import { create } from 'zustand';

interface SettingsState { sound: boolean; music: boolean; dark: boolean; toggleSound: () => void; toggleMusic: () => void; toggleDark: () => void; }
const load = <T,>(key:string, fallback:T):T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const save = (key:string, value:unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ } };
export const useSettingsStore = create<SettingsState>((set,get)=>({
  sound: load('sound', true), music: load('music', false), dark: load('dark', false),
  toggleSound:()=>set({sound:!get().sound}), toggleMusic:()=>set({music:!get().music}), toggleDark:()=>{const dark=!get().dark; document.documentElement.classList.toggle('dark', dark); save('dark', dark); set({dark});},
}));
export const persistSettings = () => useSettingsStore.subscribe(s=>{ save('sound',s.sound); save('music',s.music); });
