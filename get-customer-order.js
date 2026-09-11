const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // DOMから顧客名を取得（テーブルから）
    const customers = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const customerList = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
          const customerName = cells[1]?.textContent?.trim();
          if (customerName && customerName !== '月別合計（AB）' && customerName !== '月別合計（全て）' && 
              customerName !== '累計（AB）' && customerName !== '累計（全て）' && 
              customerName !== '既存ビジネス計' && customerName !== '開発事業部目標合計' &&
              customerName !== '営業部合計目標' && customerName !== '白地') {
            customerList.push(customerName);
          }
        }
      });
      
      return customerList;
    });
    
    console.log('=== 取得した顧客の並び順 ===');
    customers.forEach((c, i) => console.log((i+1) + '. ' + c));
    
    // JSONファイルに保存
    fs.writeFileSync('./server/customerOrder_backup.json', JSON.stringify(customers, null, 2));
    console.log('\n✅ customerOrder_backup.json に保存しました');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await browser.close();
  }
})();
