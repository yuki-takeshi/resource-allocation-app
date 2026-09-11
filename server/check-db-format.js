const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const orders = db.prepare('SELECT id, customer, name, amount, deliveryMonth FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ? LIMIT 10').all('2026-10', '2027-09');

console.log('データベース内のデータ形式:');
orders.forEach(o => {
  console.log(`  ${o.customer} - ${o.name}: amount=${o.amount} (型: ${typeof o.amount}), deliveryMonth=${o.deliveryMonth}`);
});

db.close();
