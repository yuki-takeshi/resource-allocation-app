const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// BPマッチング、MRAG以外のデータの目標値を実績値に設定
const updateStmt = db.prepare(`
  UPDATE orders
  SET targetAmount = amount
  WHERE customer NOT IN ('BPマッチング', 'MRAG') AND targetAmount = 0
`);

const result = updateStmt.run();
console.log(`✓ ${result.changes}件の目標値を設定しました（実績 = 目標）`);

db.close();
