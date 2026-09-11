const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('=== 2025-10～2026-09 の期間 ===');
const old = db.prepare('SELECT customer, name, amount, deliveryMonth FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ? LIMIT 5').all('2025-10', '2026-09');
old.forEach(o => {
  console.log(`${o.customer} - ${o.name}: ${o.amount} (${typeof o.amount})`);
});

console.log('\n=== 2026-10～2027-09 の期間 ===');
const new_data = db.prepare('SELECT customer, name, amount, deliveryMonth FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ? LIMIT 5').all('2026-10', '2027-09');
new_data.forEach(o => {
  console.log(`${o.customer} - ${o.name}: ${o.amount} (${typeof o.amount})`);
});

db.close();
