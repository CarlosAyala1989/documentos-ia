import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Generar carpeta con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16); // ej: 2025-06-11T17-30
const reportDir = `reportes/run-${timestamp}/html`;

fs.mkdirSync(reportDir, { recursive: true });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,

  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: 'on', // 🔴 Grabación de video obligatoria
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  reporter: [['html', { outputFolder: reportDir, open: 'never' }]],

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        video: 'on', // 🔁 Asegura grabación incluso si se sobreescribe arriba
      },
    },
  ],
});
