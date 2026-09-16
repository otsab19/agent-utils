---
name: visual-qa
description: >-
  Use after any change to frontend files (.tsx, .vue, .css, .scss, .html).
  Triggers Playwright screenshots at 3 viewport sizes via the sys_safe_exec
  MCP tool, compares against baseline snapshots, and flags DOM overlap or
  layout breakage before the change is committed. Prevents invisible UI
  regressions.
trigger: model_decision
---

# Visual QA

Frontend changes that look fine in dev tools can break at other viewports or
in combination with other styles. This skill catches those regressions before
they reach review.

## Trigger conditions

Activate automatically when any of these file types are modified:
`.tsx`, `.jsx`, `.vue`, `.svelte`, `.css`, `.scss`, `.less`, `.html`

## Step 1: Identify the affected components

Scan the modified files to identify which UI components or pages are affected.
If the change is to a shared style or utility, identify all components that
import it.

## Step 2: Run Playwright screenshots via MCP

Use `sys_safe_exec` to trigger Playwright at 3 viewport sizes:

```bash
timeout 120s npx playwright test --grep "<component-or-page>" \
  --config playwright.config.ts \
  --reporter=list \
  --update-snapshots=none
```

Target viewports:
- **Mobile**: 375×812 (iPhone 14)
- **Tablet**: 768×1024 (iPad)
- **Desktop**: 1440×900

If no Playwright config exists in the project, use `sys_safe_exec` to run a
lightweight script:

```bash
timeout 120s node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [name, viewport] of [
    ['mobile', {width:375,height:812}],
    ['tablet', {width:768,height:1024}],
    ['desktop', {width:1440,height:900}]
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto('http://localhost:3000/<path>');
    await page.screenshot({ path: \`.visual-qa/\${name}.png\`, fullPage: true });
  }
  await browser.close();
})();
"
```

Screenshots are saved to `.visual-qa/` in the repo root.

## Step 3: Overlap detection

For each screenshot, run a DOM overlap check. Two elements overlap when their
bounding boxes intersect and neither is a child of the other:

```javascript
// Injected into the page via page.evaluate()
const boxes = Array.from(document.querySelectorAll('*'))
  .map(el => ({ el, rect: el.getBoundingClientRect() }))
  .filter(({ rect }) => rect.width > 0 && rect.height > 0);

const overlaps = [];
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i].rect, b = boxes[j].rect;
    if (a.left < b.right && a.right > b.left &&
        a.top < b.bottom && a.bottom > b.top &&
        !boxes[i].el.contains(boxes[j].el) &&
        !boxes[j].el.contains(boxes[i].el)) {
      overlaps.push([boxes[i].el.className, boxes[j].el.className]);
    }
  }
}
return overlaps;
```

## Step 4: Report

Output a visual QA report:

```
## Visual QA Report — <component> — <timestamp>

✅ Mobile (375×812): No overlaps detected
⚠️  Tablet (768×1024): 1 overlap detected
   - `.nav-bar` overlaps `.hero-image` at top: 8px
🔴 Desktop (1440×900): Text clipped
   - `.card-title` overflow hidden at 1200px
```

## Step 5: Gate

Do not commit or declare the change complete if:
- Any 🔴 critical overlap or clipping is detected
- Any viewport shows zero-height or zero-width content that should be visible

⚠️ Warnings require user acknowledgment before continuing.

If the dev server is not running, instruct the user to start it before
running this skill (`npm run dev` or equivalent).

## Rules

- Always test all 3 viewports — not just desktop.
- Screenshots are evidence, not decoration. Reference them in PR descriptions.
- If baseline snapshots don't exist, this run creates them. Subsequent runs
  compare against the baseline.
- Never skip this skill by saying "it's just a style change."
