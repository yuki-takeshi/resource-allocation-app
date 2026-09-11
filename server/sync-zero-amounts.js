const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 実績が 0 または非常に小さい案件（単位変換の影響を受けたもの）を targetAmount に設定
const stmt = db.prepare(`
  UPDATE orders
  SET amount = targetAmount
  WHERE (amount = 0 OR amount < 1000)
    AND targetAmount > 0
    AND status != '失注'
`);

const result = stmt.run();
console.log(`✅ ${result.changes}件の案件の実績を目標と同じに設定しました`);

// 確認用：更新された案件を表示
const checkStmt = db.prepare(`
  SELECT customer, deliveryMonth, amount, targetAmount
  FROM orders
  WHERE (amount = targetAmount)
    AND targetAmount > 0
    AND status != '失注'
  ORDER BY customer, deliveryMonth
`);

const updated = checkStmt.all();
console.log(`\n合計 ${updated.length} 件の案件が更新されました`);

db.close();
