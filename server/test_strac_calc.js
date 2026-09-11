const Database = require('better-sqlite3');
const db = new Database('orders.db');

console.log('=== 2026-09 のリスク案件（C/D/E）===');
const sept = db.prepare(`
  SELECT name, customer, rank, amount FROM orders
  WHERE deliveryMonth = ? AND rank IN (?, ?, ?) AND status IN (?, ?, ?)
  ORDER BY rank, amount DESC
`).all('2026-09', 'C', 'D', 'E', '進行中', '受注確定', '受注済み');
console.log(JSON.stringify(sept, null, 2));

console.log('\n=== 仕入れデータ連携 の amount ===');
const test = db.prepare('SELECT amount FROM orders WHERE name = ? AND customer = ?').get('仕入れデータ連携', 'まきの');
console.log('Raw amount:', test.amount);
console.log('If万円単位:', test.amount);
console.log('If円単位（÷10000）:', test.amount / 10000);

console.log('\n=== 2026-09 targets ===');
const target = db.prepare('SELECT target FROM targets WHERE month = ?').get('2026-09');
console.log('Raw target:', target.target);
console.log('÷10000:', target.target / 10000);

db.close();
