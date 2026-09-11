const Database = require('better-sqlite3');
const db = new Database('orders.db');

console.log('=== targets テーブル（2026-09, 2026-10）===');
const targets = db.prepare('SELECT month, department, target FROM targets WHERE month IN (?, ?) ORDER BY month').all('2026-09', '2026-10');
console.log(JSON.stringify(targets, null, 2));

console.log('\n=== orders テーブル（C/D/E ランク、2026-09, 2026-10）===');
const orders = db.prepare('SELECT id, name, customer, rank, amount, deliveryMonth, status FROM orders WHERE rank IN (?, ?, ?) AND substr(deliveryMonth, 1, 7) IN (?, ?) ORDER BY deliveryMonth, rank').all('C', 'D', 'E', '2026-09', '2026-10');
console.log(`件数: ${orders.length}`);
console.log(JSON.stringify(orders.slice(0, 20), null, 2)); // 最初の20件を表示

db.close();
