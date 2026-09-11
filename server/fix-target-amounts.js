const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 異常な targetAmount をリセット
// 条件：targetAmount が 10000000 以上（百万円単位の異常値）
//       または amount が 0 なのに targetAmount がある

const stmt = db.prepare(`
  UPDATE orders
  SET targetAmount = 0
  WHERE targetAmount > 10000000
     OR (amount = 0 AND targetAmount > 0)
`);

const result = stmt.run();
console.log(`✅ ${result.changes}件の異常な targetAmount をリセットしました`);

db.close();
