const Database = require('better-sqlite3');
const db = new Database('orders.db');

console.log('=== targets テーブルの値 ===');
const targets = db.prepare('SELECT month, department, target FROM targets LIMIT 10').all();
console.log(JSON.stringify(targets, null, 2));

console.log('\n=== orders テーブルの値（A/B ランク、最初の5件） ===');
const orders = db.prepare('SELECT name, customer, amount, rank FROM orders WHERE rank IN (?, ?) LIMIT 5').all('A', 'B');
console.log(JSON.stringify(orders, null, 2));

db.close();
