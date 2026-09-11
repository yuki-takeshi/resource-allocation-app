const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ?').get('2026-10', '2027-09');
console.log('2026-10～2027-09 のレコード数:', total.count);

const sample = db.prepare('SELECT customer, name, amount, deliveryMonth FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ? LIMIT 10').all('2026-10', '2027-09');
console.log('\nサンプルデータ:');
sample.forEach(row => console.log(`  ${row.customer} - ${row.name}: ${row.amount}万円 (${row.deliveryMonth})`));

db.close();
