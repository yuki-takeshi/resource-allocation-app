const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 白地の10月のレコードを確認
const records = db.prepare(`
  SELECT id, name, amount, targetAmount
  FROM orders
  WHERE customer = '白地'
    AND deliveryMonth = '2026-10'
    AND status != '失注'
`).all();

console.log('白地 10月のレコード:');
records.forEach(r => {
  console.log(`  ID: ${r.id}, 案件: ${r.name}, 実績: ${r.amount}万円, 目標: ${r.targetAmount}万円`);
});

// targetAmount を 173 に設定
const updateStmt = db.prepare(`
  UPDATE orders
  SET targetAmount = ?
  WHERE customer = '白地'
    AND deliveryMonth = '2026-10'
    AND status != '失注'
`);

const result = updateStmt.run(173);
console.log(`\n✓ 白地 10月の目標を173万円に設定しました (${result.changes}件)`);

db.close();
