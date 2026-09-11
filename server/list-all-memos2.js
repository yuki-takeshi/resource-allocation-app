const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const allMemos = db.prepare('SELECT customerName, actionPlan FROM account_planning_accounts WHERE actionPlan IS NOT NULL').all();

console.log('【全メモ一覧】\n');
if (allMemos.length === 0) {
  console.log('メモが見つかりません');
} else {
  allMemos.forEach(row => {
    if (row.actionPlan && row.actionPlan.trim()) {
      console.log(`${row.customerName}:`);
      console.log(`${row.actionPlan}\n`);
    }
  });
}

db.close();
