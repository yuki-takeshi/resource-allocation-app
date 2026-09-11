const Database = require('better-sqlite3');
const db = new Database('orders.db');

console.log('=== 特定案件の amount 値 ===');
const orders = db.prepare(`
  SELECT name, customer, amount, deliveryMonth, rank
  FROM orders
  WHERE name IN (?, ?, ?, ?)
  ORDER BY deliveryMonth, name
`).all(
  'クリーンリフレリプレイス',
  '新規開発',
  'システム改修',
  'スポット'
);

console.log(JSON.stringify(orders, null, 2));

console.log('\n=== 2026-10 の D/E ランク案件の amount ===');
const cde = db.prepare(`
  SELECT name, customer, rank, amount, deliveryMonth
  FROM orders
  WHERE deliveryMonth LIKE '2026-10%'
    AND rank IN ('C', 'D', 'E')
    AND amount > 0
  ORDER BY amount DESC
`).all();

console.log(JSON.stringify(cde, null, 2));

db.close();
