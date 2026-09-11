const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 異常な targetAmount を確認
const stmt = db.prepare(`
  SELECT id, customer, deliveryMonth, amount, targetAmount
  FROM orders
  WHERE targetAmount > 100000 OR targetAmount > amount * 1.5
  ORDER BY customer, deliveryMonth
`);

const results = stmt.all();

console.log('異常な targetAmount のリスト：');
results.forEach(row => {
  console.log(`ID: ${row.id}, 顧客: ${row.customer}, 月: ${row.deliveryMonth}, 実績: ${row.amount}, 目標: ${row.targetAmount}`);
});

db.close();
