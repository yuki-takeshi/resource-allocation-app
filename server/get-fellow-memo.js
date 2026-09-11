const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const fellow = db.prepare('SELECT customerName, actionPlan FROM account_planning_accounts WHERE customerName = ?').get('フェロー');

if (fellow && fellow.actionPlan) {
  console.log('【フェロー のメモ】');
  console.log(fellow.actionPlan);
} else {
  console.log('フェローのメモが見つかりません');
}

db.close();
