import { expect, test } from '@playwright/test';
import { source as axeSource } from 'axe-core';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tutorialDone', 'yes'));
  await page.goto('/');
});

test('loads the family yutnori board on mobile', async ({ page }) => {
  await expect(page.getByText('현재 차례')).toBeVisible();
  await expect(page.getByRole('img', { name: '전통 윷놀이 판' })).toBeVisible();
  await expect(page.getByRole('button', { name: /윷 던지기/ })).toBeVisible();
});

test('starts a four-player pass-and-play game', async ({ page }) => {
  await page.getByLabel('인원').selectOption('4');
  await page.getByLabel('AI 난이도').selectOption('hard');
  await page.getByLabel('마지막 선수 AI').uncheck();
  await page.getByRole('button', { name: '새 게임' }).click();
  await expect(page.getByText('가족 4')).toBeVisible();
});

test('throws yut sticks and shows a Korean result', async ({ page }) => {
  await page.getByRole('button', { name: /윷 던지기/ }).click();
  await expect(page.getByText(/도|개|걸|윷|모|낙|백도/).last()).toBeVisible({ timeout: 2000 });
});

test('toggles dark mode and sound settings', async ({ page }) => {
  await page.getByRole('button', { name: /효과음/ }).click();
  await page.getByRole('button', { name: '다크' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('tutorial can be opened and completed', async ({ page }) => {
  await page.getByRole('button', { name: '규칙 보기' }).click();
  await expect(page.getByRole('dialog', { name: '윷놀이 튜토리얼' })).toBeVisible();
  for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '시작!' }).click();
  await expect(page.getByRole('dialog', { name: '윷놀이 튜토리얼' })).toBeHidden();
});

test('has no serious axe accessibility violations', async ({ page }) => {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => await (window as unknown as { axe: { run: (d: Document) => Promise<{ violations: Array<{ impact?: string | null }> }> } }).axe.run(document));
  const serious = results.violations.filter((v: { impact?: string | null }) => ['serious', 'critical'].includes(v.impact ?? ''));
  expect(serious).toEqual([]);
});
