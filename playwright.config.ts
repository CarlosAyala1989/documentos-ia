import { defineConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ✅ Crear carpeta con timestamp dinámico para guardar el HTML del reporte
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const reportDir = `reportes/run-${timestamp}/html`;
fs.mkdirSync(reportDir, { recursive: true });

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: true,
    video: 'on',
    screenshot: 'only-on-failure',
  },
  reporter: [['html', { outputFolder: reportDir, open: 'never' }]], // 💡 Reporte se guarda en carpeta personalizada
});
