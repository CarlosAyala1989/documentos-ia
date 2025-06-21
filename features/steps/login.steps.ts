import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/world';

Given('que soy un usuario registrado', async () => {
  await page.goto('http://localhost:3000/login');
});

When('ingreso credenciales correctas en login.html', async () => {
  await page.fill('input[type="email"]', 'ws2022073896@virtual.upt.pe');
  await page.fill('input[type="password"]', 'walas1234');
  await page.click('button[type="submit"]');
});

Then('accedo al panel principal y soy redirigido a index.html', async () => {
  await expect(page).toHaveURL(/index/);
  await expect(page.getByText('Analizador de Código con IA')).toBeVisible();
});
