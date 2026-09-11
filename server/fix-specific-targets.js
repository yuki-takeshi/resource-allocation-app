const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 異常なレコードを指定してリセット
const recordsToFix = [
  { customer: 'INI', month: '2026-11', targetAmount: 0 },
  { customer: '二天紀', month: '2026-10', targetAmount: 0 },
  { customer: '和光', month: '2026-11', targetAmount: 0 }
];

recordsToFix.forEach(record => {
  const stmt = db.prepare(`
    UPDATE orders
    SET targetAmount = ?
    WHERE customer = ? AND deliveryMonth = ?
  `);

  const result = stmt.run(record.targetAmount, record.customer, record.month);
  console.log(`✓ ${record.customer} (${record.month}): targetAmount を ${record.targetAmount} に設定（${result.changes}件）`);
});

console.log('\n✅ 異常な targetAmount をすべてリセットしました');

db.close();
