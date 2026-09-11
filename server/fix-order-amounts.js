const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('【案件金額修正スクリプト】\n');

// 修正対象の案件
const updateData = [
  { customer: 'クリーンリフレリプレイス', newAmount: 500 },
  { customer: '東京芝浦臓器', newAmount: 500 },
  { customer: '千里堂', newAmount: 324 },
  { customer: 'G&J', newAmount: 90 },
  { customer: 'JAFナビエクストラ', newAmount: 45 },
  { customer: '和光', newAmount: 15 },
  { customer: 'セキュリティ監査', newAmount: 20 },
  { customer: 'ルッカー作成', newAmount: 15 },
  { customer: 'ニヤクシステム', newAmount: 300 },
  { customer: 'LifePresent', newAmount: 5 },
];

console.log('修正前：');
updateData.forEach(item => {
  const current = db.prepare('SELECT id, customer, amount FROM orders WHERE customer = ? ORDER BY deliveryMonth LIMIT 1').get(item.customer);
  if (current) {
    console.log(`  ${item.customer}: 現在=${current.amount}万円 → 修正先=${item.newAmount}万円`);
  } else {
    console.log(`  ${item.customer}: データなし`);
  }
});

console.log('\n【修正を実行中...】\n');

// 各案件を修正（すべてのレコードを同じ金額に統一）
updateData.forEach(item => {
  const stmt = db.prepare(`UPDATE orders SET amount = ? WHERE customer = ?`);
  const result = stmt.run(item.newAmount, item.customer);
  console.log(`✅ ${item.customer}: ${result.changes}件を${item.newAmount}万円に修正`);
});

console.log('\n【修正後：】');
updateData.forEach(item => {
  const records = db.prepare('SELECT id, customer, amount, deliveryMonth FROM orders WHERE customer = ? ORDER BY deliveryMonth').all(item.customer);
  if (records.length > 0) {
    console.log(`${item.customer}: ${records.length}件`);
    records.slice(0, 3).forEach(r => {
      console.log(`  ${r.deliveryMonth}: ${r.amount}万円`);
    });
    if (records.length > 3) {
      console.log(`  ... 他${records.length - 3}件`);
    }
  }
});

db.close();
console.log('\n✅ 修正完了！ブラウザで Ctrl+Shift+R でリロードしてください。');
