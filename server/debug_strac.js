const Database = require('better-sqlite3');
const db = new Database('orders.db');

console.log('=== targets テーブル（2026-09, 10, 11） ===');
const targets = db.prepare('SELECT month, department, target FROM targets WHERE month IN (?, ?, ?) ORDER BY month, department').all('2026-09', '2026-10', '2026-11');
console.log(JSON.stringify(targets, null, 2));

console.log('\n=== orders テーブル（2026-10, D/E ランク、サンプル） ===');
const orders = db.prepare('SELECT name, customer, rank, amount FROM orders WHERE rank IN (?, ?) AND deliveryMonth = ? LIMIT 3').all('D', 'E', '2026-10');
console.log(JSON.stringify(orders, null, 2));

console.log('\n=== 2026-09 の全体合計（確認） ===');
const sept = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE deliveryMonth = ? AND rank IN (?, ?, ?)').get('2026-09', 'C', 'D', 'E');
console.log('C/D/E total (円):', sept.total);
console.log('C/D/E total (万円):', sept.total / 10000);

db.close();
