import { test, expect } from '@playwright/test';
import path from 'path';

test('Subir archivo, analizar con IA y visualizar PDF', async ({ page, context }) => {
  test.setTimeout(90_000);

  // 1. Ir al login
  await page.goto('http://localhost:3000');

  // 2. Login
  await page.fill('input[type="email"]', 'ws2022073896@virtual.upt.pe');
  await page.fill('input[type="password"]', 'walas1234');
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  // 3. Esperar botón "Seleccionar Archivos"
  const selectButton = page.locator('button:has(i.fa-folder-open)');
  await expect(selectButton).toBeVisible({ timeout: 10_000 });

  // 4. Subir archivo
  const fileChooserPromise = page.waitForEvent('filechooser');
  await selectButton.click();
  const fileChooser = await fileChooserPromise;
  const filePath = path.resolve('tests/files/admin_usuarios.php');
  await fileChooser.setFiles(filePath);

  // 5. Esperar botón "Analizar con IA"
  const analyzeButton = page.locator('button:has-text("Analizar con IA")');
  await expect(analyzeButton).toBeVisible({ timeout: 15_000 });

  // 6. Esperar 5 segundos antes de hacer clic
  await page.waitForTimeout(5000);
  await analyzeButton.click();

  // 7. Esperar botón "Descargar PDF" (máx 30 segundos)
  const pdfButton = page.locator('button:has-text("Descargar PDF")');
  await expect(pdfButton).toBeVisible({ timeout: 30_000 });

  // 8. Esperar a que se abra nueva página al hacer clic en "Descargar PDF"
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    pdfButton.click(),
  ]);

  // 9. Esperar que cargue la nueva página
  await newPage.waitForLoadState('load');

  // 10. Scroll lento desde arriba hacia abajo
  await newPage.evaluate(async () => {
    window.scrollTo(0, 0); // Asegura que comience desde arriba
    const scrollHeight = document.body.scrollHeight;
    const step = 100;
    for (let y = 0; y < scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms entre pasos
    }
  });

  // 11. Esperar 5 segundos al final para grabar bien todo
  await newPage.waitForTimeout(5000);

  console.log('✅ Proceso completado con scroll gradual y análisis IA.');
});
