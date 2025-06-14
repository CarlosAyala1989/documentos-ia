import { test, expect } from '@playwright/test';
import path from 'path';

// Test: Subir múltiples archivos de código y generar UML

const codeFiles = [
  'aplicacion.php',
  'control.php',
  'index.php',
  'salir.php',
  'seguridad.php'
].map(file => path.resolve('tests/files', file));

test('Subir código y generar diagrama UML', async ({ page, context }) => {
  test.setTimeout(120_000);

  // 1. Ir a la página principal
  await page.goto('http://localhost:3000');

  // 1.5. Login
  await page.fill('input[type="email"]', 'ws2022073896@virtual.upt.pe');
  await page.fill('input[type="password"]', 'walas1234');
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  // 1.6. Esperar que cargue el botón "Documento personalizado"
  const docPersonalizadoBtn = page.getByRole('button', { name: /Documento personalizado/i });
  await expect(docPersonalizadoBtn).toBeVisible({ timeout: 10000 });
  await docPersonalizadoBtn.click();

  // 2. Esperar y hacer clic en "Seleccionar Código"
  const seleccionarCodigoBtn = page.getByRole('button', { name: /Seleccionar Código/i });
  await expect(seleccionarCodigoBtn).toBeVisible({ timeout: 10000 });

  const fileChooserPromise = page.waitForEvent('filechooser');
  await seleccionarCodigoBtn.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(codeFiles);

  // 3. Esperar a que se habilite el botón "Generar Solo Diagramas UML"
  const generarBtn = page.locator('#generarDiagramasBtn');
  await expect(generarBtn).toBeVisible();

  // 4. Primero preparamos el handler del prompt
  page.once('dialog', async (dialog) => {
    await dialog.accept('secuencia');
  });

  // 4.5. Ahora sí, hacemos clic para disparar el prompt
  await generarBtn.click();

  // 5. Esperar generación de UML (20 segundos)
  await page.waitForTimeout(20_000);

  // 6. Copiar el código UML del contenedor correspondiente
  const umlCodeElement = page.locator('div.plantuml-contenido pre');
  await expect(umlCodeElement).toBeVisible();
  const umlCode = await umlCodeElement.textContent();

  // 7. Ir a https://www.planttext.com/
  const newPage = await context.newPage();
  await newPage.goto('https://www.planttext.com/');

  // 7.5. Cerrar anuncio emergente si existe
  const modals = newPage.locator('div.ui-dialog');
  const count = await modals.count();

  for (let i = 0; i < count; i++) {
    const modal = modals.nth(i);
    const closeBtn = modal.locator('button[title="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      break;
    }
  }

  // 8. Esperar editor y pegar el código
  const editor = newPage.locator('div.ace_content');
  await expect(editor).toBeVisible({ timeout: 10000 });
  await editor.click();

  // Pegar directamente en el editor
  await newPage.evaluate((umlCode) => {
    const editorInstance = (window as any).ace.edit("editor");
    editorInstance.setValue(umlCode, -1);
  }, umlCode);

  // 9. Hacer clic en "Refresh"
  await newPage.locator('input#refresh-button2').click();

  // 10. Ver página durante 5 segundos
  await newPage.waitForTimeout(5000);
});
