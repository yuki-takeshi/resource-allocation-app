const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// BPマッチングとMRAGの目標を実績と同じで設定
const result = db.prepare(`
  UPDATE orders
  SET targetAmount = amount
  WHERE customer IN ('BPマッチング', 'MRAG')
    AND deliveryMonth BETWEEN '2026-10' AND '2027-09'
`).run();

console.log(`✓ ${result.changes}件の営業部目標を実績と同じに設定しました`);

// 確認
const records = db.prepare(`
  SELECT customer, deliveryMonth, amount, targetAmount
  FROM orders
  WHERE customer IN ('BPマッチング', 'MRAG')
    AND deliveryMonth BETWEEN '2026-10' AND '2027-09'
  ORDER BY customer, deliveryMonth
`).all();

console.log('\n営業部目標設定確認:');
records.forEach(r => {
  console.log(`  ${r.customer} ${r.deliveryMonth}: 実績=${r.amount}万円, 目標=${r.targetAmount}万円`);
});

db.close();
