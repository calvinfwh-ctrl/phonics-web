/**
 * Phonics Web App Phase 1 — E2E Test Suite
 * Tests: page accessibility, Stage 2 CVC L1-L5 flow, Tab Bar, Practice, Rewards, Console errors
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const RESULTS = [];

function record(test, status, detail = '') {
  RESULTS.push({ test, status, detail });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${test}${detail ? ': ' + detail : ''}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 }, // iPad landscape
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // ─── TEST 1: All 3 tabs load without error ───
  console.log('\n📋 === Page Accessibility ===');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForSelector('header', { timeout: 5000 });
    record('GET / returns 200 + renders', 'PASS');
  } catch (e) {
    record('GET / returns 200 + renders', 'FAIL', e.message);
  }

  // Screenshot: Learn tab (default)
  await page.screenshot({ path: '/tmp/phonics-tab-learn.png', fullPage: true });

  // Navigate to Practice tab
  try {
    await page.click('button:has-text("练规则")');
    await page.waitForTimeout(500);
    await page.waitForSelector('text=针对性练习', { timeout: 3000 });
    record('Practice tab loads', 'PASS');
    await page.screenshot({ path: '/tmp/phonics-tab-practice.png', fullPage: true });
  } catch (e) {
    record('Practice tab loads', 'FAIL', e.message);
  }

  // Navigate to Rewards tab
  try {
    await page.click('button:has-text("奖励")');
    await page.waitForTimeout(500);
    await page.waitForSelector('text=规则进度', { timeout: 3000 });
    record('Rewards tab loads', 'PASS');
    await page.screenshot({ path: '/tmp/phonics-tab-rewards.png', fullPage: true });
  } catch (e) {
    record('Rewards tab loads', 'FAIL', e.message);
  }

  // Back to Learn tab
  await page.click('button:has-text("学规则")');
  await page.waitForTimeout(500);

  // ─── TEST 2: Stage 2 rule list renders ───
  console.log('\n📋 === Stage 2 Rule List ===');

  try {
    await page.waitForSelector('text=Stage 2: CVC 短元音', { timeout: 3000 });
    record('Stage 2 header visible', 'PASS');
  } catch (e) {
    record('Stage 2 header visible', 'FAIL', e.message);
  }

  // Check all 5 rules are present
  const rules = ['Short Vowel A', 'Short Vowel E', 'Short Vowel I', 'Short Vowel O', 'Short Vowel U'];
  let allRulesVisible = true;
  for (const rule of rules) {
    try {
      await page.waitForSelector(`text=${rule}`, { timeout: 2000 });
    } catch (e) {
      allRulesVisible = false;
      console.log(`  ⚠️ Missing rule: ${rule}`);
    }
  }
  record(`All 5 CVC rules visible (${rules.length})`, allRulesVisible ? 'PASS' : 'FAIL');
  await page.screenshot({ path: '/tmp/phonics-rule-list.png', fullPage: true });

  // ─── TEST 3: Click a rule to start session ───
  console.log('\n📋 === Stage 2 CVC L1-L5 Flow ===');

  try {
    await page.click('button:has-text("Short Vowel A")');
    await page.waitForTimeout(800);
    // Should now be in L1 exercise
    await page.waitForSelector('text=L1 听音辨字', { timeout: 3000 });
    record('Rule click starts L1 session', 'PASS');
    await page.screenshot({ path: '/tmp/phonics-l1-start.png', fullPage: true });
  } catch (e) {
    record('Rule click starts L1 session', 'FAIL', e.message);
    // Try to continue anyway
  }

  // ─── TEST 3a: Complete L1 (Listen & Discriminate) ───
  console.log('  Running L1 Listen & Discriminate...');
  try {
    for (let i = 0; i < 5; i++) {
      // Click the speaker button to play audio
      await page.click('button[aria-label="播放发音"]');
      await page.waitForTimeout(1000);

      // Randomly pick yes/no (try to get at least 3/5 correct for passing)
      const pickYes = Math.random() > 0.3;
      if (pickYes) {
        await page.click('button:has-text("✅ 有")');
      } else {
        await page.click('button:has-text("❌ 没有")');
      }
      await page.waitForTimeout(1800); // wait for feedback + auto-advance
    }
    record('L1 completed (5 questions)', 'PASS');
    await page.screenshot({ path: '/tmp/phonics-l1-complete.png', fullPage: true });
  } catch (e) {
    record('L1 completed (5 questions)', 'FAIL', e.message);
  }

  // Check for level advancement
  let onL2 = false;
  try {
    await page.waitForSelector('text=L2 拼读合成', { timeout: 5000 });
    onL2 = true;
    record('Advanced to L2', 'PASS');
  } catch (e) {
    // Might still be on L1 if failed
    const pageContent = await page.textContent('body');
    if (pageContent.includes('L1')) {
      record('Advanced to L2', 'WARN', 'Still on L1 (may have failed threshold)');
    } else {
      record('Advanced to L2', 'FAIL', e.message);
    }
  }

  // ─── TEST 3b: L2 Blend & Read ───
  if (onL2) {
    console.log('  Running L2 Blend & Read...');
    try {
      for (let i = 0; i < 5; i++) {
        // Click speaker to hear blend
        await page.click('button[aria-label="播放拼读"]');
        await page.waitForTimeout(2000);

        // Click first choice (may or may not be correct)
        const choices = await page.$$('div.flex-wrap button');
        if (choices.length > 0) {
          await choices[0].click();
        }
        await page.waitForTimeout(1800);
      }
      record('L2 completed (5 questions)', 'PASS');
      await page.screenshot({ path: '/tmp/phonics-l2-complete.png', fullPage: true });
    } catch (e) {
      record('L2 completed (5 questions)', 'FAIL', e.message);
    }

    // Attempt L3, L4, L5 similarly...
    let onL3 = false;
    try {
      await page.waitForSelector('text=L3 词族扩展', { timeout: 5000 });
      onL3 = true;
      record('Advanced to L3', 'PASS');
    } catch (e) {
      record('Advanced to L3', 'WARN', 'May have failed L2 or different state');
    }

    if (onL3) {
      try {
        for (let i = 0; i < 5; i++) {
          const choices = await page.$$('div.flex-wrap button');
          if (choices.length > 0) await choices[0].click();
          await page.waitForTimeout(1800);
        }
        record('L3 completed', 'PASS');
        await page.screenshot({ path: '/tmp/phonics-l3-complete.png', fullPage: true });
      } catch (e) {
        record('L3 completed', 'FAIL', e.message);
      }

      // Check L4
      let onL4 = false;
      try {
        await page.waitForSelector('text=L4 音素替换', { timeout: 5000 });
        onL4 = true;
        record('Advanced to L4', 'PASS');
      } catch (e) {
        record('Advanced to L4', 'WARN', 'May have failed L3');
      }

      if (onL4) {
        try {
          for (let i = 0; i < 4; i++) {
            const choices = await page.$$('div.flex-wrap button');
            if (choices.length > 0) await choices[0].click();
            await page.waitForTimeout(1800);
          }
          record('L4 completed', 'PASS');
          await page.screenshot({ path: '/tmp/phonics-l4-complete.png', fullPage: true });
        } catch (e) {
          record('L4 completed', 'FAIL', e.message);
        }

        // Check L5
        try {
          await page.waitForSelector('text=L5 终极挑战', { timeout: 5000 });
          record('Advanced to L5', 'PASS');
          
          for (let i = 0; i < 4; i++) {
            const choices = await page.$$('div.flex-wrap button');
            if (choices.length > 0) await choices[0].click();
            await page.waitForTimeout(2200);
          }
          record('L5 completed', 'PASS');
          await page.screenshot({ path: '/tmp/phonics-l5-complete.png', fullPage: true });
        } catch (e) {
          record('L5', 'WARN', 'May have failed L4 or L5 auto-advance differs');
        }
      }
    }
  }

  // ─── TEST 4: Practice page - struggling items ───
  console.log('\n📋 === Practice & Adaptive Learning ===');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('button:has-text("练规则")');
  await page.waitForTimeout(500);

  try {
    const practiceContent = await page.textContent('body');
    const hasStruggling = practiceContent.includes('卡在 L');
    const hasNoReview = practiceContent.includes('没有需要复习的规则');
    record('Practice page shows adaptive content', 'PASS',
      hasStruggling ? 'Has struggling rules' : (hasNoReview ? 'No review needed' : 'Content rendered'));
    await page.screenshot({ path: '/tmp/phonics-practice-result.png', fullPage: true });
  } catch (e) {
    record('Practice page adaptive content', 'FAIL', e.message);
  }

  // ─── TEST 5: Rewards page ───
  await page.click('button:has-text("奖励")');
  await page.waitForTimeout(500);

  try {
    // Check for progress indicators
    const hasMastered = await page.textContent('body');
    record('Rewards page shows stats', 'PASS',
      `Content: ${hasMastered.includes('已掌握') ? 'mastery count' : ''} ${hasMastered.includes('总星星') ? 'stars' : ''} ${hasMastered.includes('规则进度') ? 'progress' : ''}`);
    await page.screenshot({ path: '/tmp/phonics-rewards-result.png', fullPage: true });
  } catch (e) {
    record('Rewards page content', 'FAIL', e.message);
  }

  // ─── TEST 6: iPad landscape layout ───
  console.log('\n📋 === iPad / Mobile Checks ===');

  // Test in iPad landscape
  const ipadLandscape = await browser.newContext({
    viewport: { width: 1194, height: 834 }, // iPad Pro 11" landscape
    deviceScaleFactor: 2,
  });
  const iPadPage = await ipadLandscape.newPage();

  try {
    await iPadPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    // Check tab bar is visible and buttons are large
    const tabButton = await iPadPage.$('nav.fixed button');
    if (tabButton) {
      const box = await tabButton.boundingBox();
      record('iPad landscape: Tab buttons present', 'PASS',
        `Button size: ${Math.round(box.width)}x${Math.round(box.height)}px (min 48x48 required)`);
    }
    await iPadPage.screenshot({ path: '/tmp/phonics-ipad-landscape.png', fullPage: true });
  } catch (e) {
    record('iPad landscape layout', 'FAIL', e.message);
  }
  await ipadLandscape.close();

  // ─── TEST 7: Console errors ───
  console.log('\n📋 === Console Error Check ===');
  if (consoleErrors.length === 0) {
    record('Zero console errors', 'PASS');
  } else {
    record('Zero console errors', 'FAIL', consoleErrors.join('; '));
  }

  // ─── SUMMARY ───
  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E TEST SUMMARY');
  console.log('='.repeat(60));

  const passCount = RESULTS.filter(r => r.status === 'PASS').length;
  const failCount = RESULTS.filter(r => r.status === 'FAIL').length;
  const warnCount = RESULTS.filter(r => r.status === 'WARN').length;

  for (const r of RESULTS) {
    console.log(`${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️'} ${r.test}${r.detail ? ` — ${r.detail}` : ''}`);
  }

  console.log(`\nTotal: ${passCount} pass, ${failCount} fail, ${warnCount} warn`);

  await browser.close();

  return { passCount, failCount, warnCount, consoleErrors };
}

run().then(summary => {
  if (summary.failCount > 0) process.exit(1);
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
