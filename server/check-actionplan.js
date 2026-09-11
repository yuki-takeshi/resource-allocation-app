const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const data = db.prepare('SELECT customerName, actionPlan FROM account_planning_accounts WHERE actionPlan IS NOT NULL LIMIT 5').all();
console.log('【メモデータ】');
if (data.length === 0) {
  console.log('  メモデータが見つかりません');
} else {
  data.forEach(row => {
    console.log(\  \: \...\);
  });
}

db.close();
