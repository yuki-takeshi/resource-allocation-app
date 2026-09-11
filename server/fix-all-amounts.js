const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('【案件金額の一括修正】\n');

// 修正対象（すべてのレコードをこの値に統一）
const updateData = [
  { customer: '東京芝浦臓器', amount: 500 },
  { customer: '千里堂', amount: 324 },
  { customer: 'G&J', amount: 90 },
  { customer: '和光', amount: 15 },
  { customer: 'ニヤクシステム', amount: 300 },
];

// 各案件のすべてのレコードを修正
updateData.forEach(item => {
  // 現在のレコード数を確認
  const current = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE customer = ?').get(item.customer);

  // すべてのレコードを修正
  const stmt = db.prepare(`UPDATE orders SET amount = ? WHERE customer = ? AND status != '失注'`);
  const result = stmt.run(item.amount, item.customer);

  console.log(`${item.customer}: ${current.cnt}件中${result.changes}件を${item.amount}万円に修正`);
});

console.log('\n【修正後のデータ確認】\n');

// 修正後のデータを確認
updateData.forEach(item => {
  const records = db.prepare(`
    SELECT customer, amount, targetAmount, deliveryMonth
    FROM orders
    WHERE customer = ?
    ORDER BY deliveryMonth
    LIMIT 3
  `).all(item.customer);

  console.log(`${item.customer}:`);
  records.forEach(r => {
    console.log(`  ${r.deliveryMonth}: amount=${r.amount}万円, target=${r.targetAmount}万円`);
  });
});

console.log('\n✅ 修正完了！');

db.close();
