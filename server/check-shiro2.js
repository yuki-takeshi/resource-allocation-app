const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 白地 10月のデータを確認
const shiro = db.prepare('SELECT id, customer, deliveryMonth, amount, targetAmount FROM orders WHERE customer = ? AND deliveryMonth = ?').get('白地', '2026-10');

console.log('【現在のデータ】');
if (shiro) {
  console.log(`ID: ${shiro.id}`);
  console.log(`顧客: ${shiro.customer}`);
  console.log(`月: ${shiro.deliveryMonth}`);
  console.log(`実績: ${shiro.amount}万円`);
  console.log(`目標: ${shiro.targetAmount}万円`);
} else {
  console.log('データが見つかりません');
}

db.close();
