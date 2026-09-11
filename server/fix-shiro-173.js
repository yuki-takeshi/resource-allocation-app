const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 白地 10月の目標を修正（1.73 → 173）
const stmt = db.prepare('UPDATE orders SET targetAmount = ? WHERE customer = ? AND deliveryMonth = ?');
const result = stmt.run(173, '白地', '2026-10');

console.log(`✅ 白地 10月の目標を 173万円 に修正しました（${result.changes}件）`);

// 確認
const updated = db.prepare('SELECT customer, deliveryMonth, amount, targetAmount FROM orders WHERE customer = ? AND deliveryMonth = ?').get('白地', '2026-10');
console.log(`\n修正後: 実績=${updated.amount}万円, 目標=${updated.targetAmount}万円`);

db.close();
