/**
 * Visual/Spatial QA — Vision API Wrapper
 *
 * Sends captured screenshots to a vision endpoint for layout integrity,
 * text readability, and broken bounding-box analysis.
 *
 * Supports pluggable vision backends (Google Vision, OpenAI GPT-4V, Gemini).
 */

import * as fs from 'node:fs/promises';
import type { CaptureResult } from './driver.js';

export interface VisionAnalysis {
  viewport: string;
  passed: boolean;
  issues: string[];
  confidence: number;
}

export interface VisionBackend {
  name: string;
  analyze: (imageBase64: string, context: string) => Promise<VisionAnalysis>;
}

/**
 * Stub vision backend — replace with real API calls.
 * Expects env vars: VISION_API_KEY, VISION_API_ENDPOINT
 */
const stubVisionBackend: VisionBackend = {
  name: 'stub',
  async analyze(_imageBase64: string, context: string): Promise<VisionAnalysis> {
    // TODO: Implement real vision API call
    // Example for OpenAI GPT-4V:
    // POST https://api.openai.com/v1/chat/completions
    // { model: "gpt-4o", messages: [{ role: "user", content: [{ type: "image_url", ... }] }] }
    console.warn(`[VisionQA] Stub backend called for: ${context}`);
    return {
      viewport: context,
      passed: true,
      issues: ['[STUB] No real vision analysis performed. Configure VISION_API_KEY.'],
      confidence: 0,
    };
  },
};

/**
 * Analyzes all captured viewport screenshots against the vision backend.
 *
 * @param captures - Results from captureAllViewports()
 * @param backend - Vision backend (defaults to stub)
 */
export async function analyzeScreenshots(
  captures: CaptureResult[],
  backend: VisionBackend = stubVisionBackend
): Promise<VisionAnalysis[]> {
  const analyses: VisionAnalysis[] = [];

  for (const capture of captures) {
    const imageBuffer = await fs.readFile(capture.screenshotPath);
    const imageBase64 = imageBuffer.toString('base64');
    const context = `${capture.viewport.name} (${capture.viewport.width}px)`;

    const analysis = await backend.analyze(imageBase64, context);
    analyses.push(analysis);
  }

  return analyses;
}
