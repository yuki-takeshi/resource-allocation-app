const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  
  try {
    // ページを開く
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // 新規案件ボタンをクリック
    const addButton = page.locator('button:has-text("新規案件")');
    await addButton.click();
    await page.waitForTimeout(800);
    
    // フォームに入力：1件目
    await page.fill('input[placeholder="基幹システム刷新"]', 'テスト案件グループ');
    await page.fill('input[placeholder="A社"]', 'テスト顧客A');
    await page.fill('input[step="0.1"]', '50');
    
    // 受注日を入力
    const inputs = await page.locator('input[type="date"]').all();
    await inputs[0].fill('2026-01-01');
    
    // 予定納期月を入力
    const monthInputs = await page.locator('input[type="month"]').all();
    await monthInputs[0].fill('2026-09');
    
    // 部署を選択
    await page.selectOption('select', 'オープン１課');
    
    // ランクを選択
    const selects = await page.locator('select').all();
    await selects[1].selectOption('D');
    
    // 追加ボタンをクリック
    const submitButton = page.locator('button:has-text("追加")').first();
    await submitButton.click();
    await page.waitForTimeout(800);
    
    console.log('Created 1st order');
    
    // 2件目を追加：同じ案件名で顧客名を変更
    await addButton.click();
    await page.waitForTimeout(800);
    
    await page.fill('input[placeholder="基幹システム刷新"]', 'テスト案件グループ');
    await page.fill('input[placeholder="A社"]', 'テスト顧客B');
    await page.fill('input[step="0.1"]', '60');
    
    await inputs[0].fill('2026-01-02');
    await monthInputs[0].fill('2026-09');
    
    await page.selectOption('select', 'オープン１課');
    await selects[1].selectOption('C');
    
    await submitButton.click();
    await page.waitForTimeout(800);
    
    console.log('Created 2nd order');
    
    // ページをスクロール下へ
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(500);
    
    // スクリーンショット：折りたたみ状態
    await page.screenshot({ path: 'C:\\Users\\yukit\\screenshot_collapsed.png', fullPage: true });
    console.log('Screenshot 1 taken: collapsed state');
    
    // グループ行をクリック（展開）
    const table = page.locator('table').nth(1);
    const groupRow = await table.locator('tbody tr').filter({ has: page.locator('[class*="from-blue"]') }).first();
    
    if (groupRow) {
      await groupRow.click();
      await page.waitForTimeout(500);
      
      // スクリーンショット：展開状態
      await page.screenshot({ path: 'C:\\Users\\yukit\\screenshot_expanded.png', fullPage: true });
      console.log('Screenshot 2 taken: expanded state');
      
      // グループ行をクリック（折りたたみ）
      await groupRow.click();
      await page.waitForTimeout(500);
      
      // スクリーンショット：再度折りたたみ
      await page.screenshot({ path: 'C:\\Users\\yukit\\screenshot_final_collapsed.png', fullPage: true });
      console.log('Screenshot 3 taken: final collapsed state');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
