import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/world';

Given('que el análisis ha finalizado', async () => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'ws2022073896@virtual.upt.pe');
  await page.fill('input[type="password"]', 'walas1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/index/);
});

When('el frontend recibe el texto', async () => {
  await page.waitForSelector('#resultado');
});

Then('se muestra en el panel de resultados correctamente', async () => {
  await expect(page.locator('#resultado')).toBeVisible();
});
