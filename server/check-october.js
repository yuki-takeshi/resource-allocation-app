const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const result = db.prepare('SELECT COUNT(*) as count FROM orders WHERE deliveryMonth = ?').get('2026-10');
console.log('2026-10のレコード数:', result.count);

const details = db.prepare('SELECT name, customer, amount FROM orders WHERE deliveryMonth = ? ORDER BY customer, name').all('2026-10');
console.log('\n2026-10の詳細:');
details.forEach(row => {
  console.log(`  ${row.customer} - ${row.name}: ${row.amount}万円`);
});

db.close();
