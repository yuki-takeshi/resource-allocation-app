const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// targetAmount が 0 でない案件を、amount = targetAmount に設定
const stmt = db.prepare(`
  UPDATE orders
  SET amount = targetAmount
  WHERE targetAmount > 0
    AND amount <> targetAmount
    AND status != '失注'
`);

const result = stmt.run();
console.log(`✅ ${result.changes}件の案件の実績を目標と同じに設定しました`);

// 確認用：更新された案件を表示
const checkStmt = db.prepare(`
  SELECT customer, deliveryMonth, amount, targetAmount
  FROM orders
  WHERE targetAmount > 0 AND amount = targetAmount AND status != '失注'
  ORDER BY customer, deliveryMonth
  LIMIT 20
`);

const updated = checkStmt.all();
console.log('\n更新された案件（先頭20件）:');
updated.forEach(row => {
  console.log(`  ${row.customer} (${row.deliveryMonth}): ${row.amount}円`);
});

db.close();
