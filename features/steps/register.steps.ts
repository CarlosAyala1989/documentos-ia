import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/world';

Given('que un visitante está en la página de registro', async () => {
  await page.goto('http://localhost:3000/register');
});

When('ingresa un nombre válido, correo no registrado y contraseña segura', async () => {
  await page.fill('input[name="nombre"]', 'Carlos');
  await page.fill('input[name="email"]', 'nuevo@correo.com');
  await page.fill('input[name="password"]', 'segura1234');
});

When('hace clic en "Registrar"', async () => {
  await page.click('button[type="submit"]');
});

Then('el sistema crea la cuenta y redirige al inicio de sesión', async () => {
  await expect(page).toHaveURL(/login/);
});
