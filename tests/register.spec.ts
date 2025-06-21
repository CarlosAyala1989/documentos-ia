import { test, expect } from '@playwright/test';

test('Registro y login exitoso de nuevo usuario', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Ir a la pestaña de registro
  await page.locator('#registerTab').click();

  // Llenar el formulario de registro
  const nombre = 'Nuevo Usuario';
  const email = `nuevo${Date.now()}@mail.com`; // Email único cada vez
  const password = 'test1234';

  await page.fill('#registerName', nombre);
  await page.fill('#registerEmail', email);
  await page.fill('#registerPassword', password);
  await page.fill('#confirmPassword', password);

  // Hacer clic en "Crear Cuenta"
  await page.locator('#registerForm button[type="submit"]').click();

  // Verificar el mensaje de éxito
  const mensajeRegistro = page.locator('#registerMessage', { hasText: 'Usuario registrado correctamente' });
  await expect(mensajeRegistro).toBeVisible({ timeout: 7000 });

  // Esperar a que se recargue el login (asumiendo que vuelve al login después de 3 segundos)
  await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {}); // por si no cambia la URL
  await page.waitForTimeout(4000); // Espera extra por el reload automático

  // Llenar login con las nuevas credenciales
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  // Verificar mensaje de inicio de sesión exitoso
  await expect(page.locator('text=Inicio de sesión exitoso')).toBeVisible({ timeout: 7000 });

  // Capturar pantalla final
  await page.screenshot({ path: 'tests/screenshots/registro-y-login.png', fullPage: true });
});
