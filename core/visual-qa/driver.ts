/**
 * Visual/Spatial QA — Playwright Driver
 *
 * Trigger: Modification to frontend styling, layout templates, or UI components.
 * Captures screenshots at 3 viewports: Mobile (390px), Tablet (768px), Desktop (1440px).
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export interface ViewportConfig {
  name: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
}

export interface CaptureResult {
  viewport: ViewportConfig;
  screenshotPath: string;
  capturedAt: Date;
}

export const VIEWPORTS: ViewportConfig[] = [
  { name: 'mobile',  width: 390,  height: 844  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900  },
];

/**
 * Launches an ephemeral Chromium instance, navigates to the target URL,
 * and captures screenshots at all 3 standard viewports.
 *
 * @param targetUrl - The local preview server URL (e.g., http://localhost:3000)
 * @param outputDir - Directory to write screenshots into
 */
export async function captureAllViewports(
  targetUrl: string,
  outputDir: string
): Promise<CaptureResult[]> {
  await fs.mkdir(outputDir, { recursive: true });

  let browser: Browser | null = null;
  const results: CaptureResult[] = [];

  try {
    browser = await chromium.launch({ headless: true });

    for (const viewport of VIEWPORTS) {
      const page: Page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
      // Allow any CSS animations to settle
      await page.waitForTimeout(500);

      const screenshotPath = path.join(outputDir, `${viewport.name}-${viewport.width}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await page.close();

      results.push({ viewport, screenshotPath, capturedAt: new Date() });
    }
  } finally {
    await browser?.close();
  }

  return results;
}
