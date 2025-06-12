import { test, expect } from '@playwright/test';

test('Login exitoso con credenciales válidas', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Llenar login
  await page.fill('input[type="email"]', 'ws2022073896@virtual.upt.pe');
  await page.fill('input[type="password"]', 'walas1234');
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  // Esperar mensaje de éxito
  await expect(page.locator('text=Inicio de sesión exitoso')).toBeVisible({ timeout: 7000 });

  // Esperar redirección
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

  // Verificar que estás en la página principal por su contenido
  await expect(page.locator('text=Analizador de Código con IA')).toBeVisible({ timeout: 5000 });

  // Captura por si falla algo
  await page.screenshot({ path: 'tests/screenshots/login-success.png', fullPage: true });
});
