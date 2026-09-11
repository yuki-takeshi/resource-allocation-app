const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 白地 10月のデータを確認
const shiro = db.prepare('SELECT id, customer, deliveryMonth, amount, targetAmount FROM orders WHERE customer = ? AND deliveryMonth = ?').get('白地', '2026-10');

console.log('【現在のデータ】');
if (shiro) {
  console.log(\ID: \\);
  console.log(\顧客: \\);
  console.log(\月: \\);
  console.log(\実績: \万円\);
  console.log(\目標: \万円\);
} else {
  console.log('データが見つかりません');
}

db.close();
