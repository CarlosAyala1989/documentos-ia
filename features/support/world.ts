import { chromium, Browser, Page } from '@playwright/test';

let browser: Browser;
export let page: Page;

export async function globalSetup() {
  browser = await chromium.launch();
  page = await browser.newPage();
}

export async function globalTeardown() {
  await browser.close();
}
