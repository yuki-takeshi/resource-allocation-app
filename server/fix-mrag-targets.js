const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// MRAGの10月と11月の目標を修正
const updates = [
  { month: '2026-10', targetAmount: 35 },
  { month: '2026-11', targetAmount: 1 }
];

updates.forEach(({ month, targetAmount }) => {
  const stmt = db.prepare(`
    UPDATE orders
    SET targetAmount = ?
    WHERE customer = 'MRAG'
      AND deliveryMonth = ?
  `);

  const result = stmt.run(targetAmount, month);
  console.log(`✓ MRAG ${month}: 目標を${targetAmount}万円に設定 (${result.changes}件)`);
});

db.close();
