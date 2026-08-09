import { describe, expect, it, beforeEach } from 'vitest';
import { persistSettings, useSettingsStore } from './settingsStore';

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    useSettingsStore.setState({ sound: true, music: false, dark: false });
  });

  it('toggles sound, music and dark mode with persistence hooks', () => {
    const unsubscribe = persistSettings();
    useSettingsStore.getState().toggleSound();
    useSettingsStore.getState().toggleMusic();
    useSettingsStore.getState().toggleDark();
    expect(useSettingsStore.getState().sound).toBe(false);
    expect(useSettingsStore.getState().music).toBe(true);
    expect(useSettingsStore.getState().dark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('sound')).toBe('false');
    expect(localStorage.getItem('music')).toBe('true');
    expect(localStorage.getItem('dark')).toBe('true');
    unsubscribe();
  });
});
