const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// account_planning_accounts のスキーマを確認
const schema = db.prepare("PRAGMA table_info(account_planning_accounts)").all();
console.log('【account_planning_accounts のカラム】');
schema.forEach(col => console.log('  ' + col.name + ' (' + col.type + ')'));

// データを確認
const data = db.prepare('SELECT id, name, memo FROM account_planning_accounts LIMIT 3').all();
console.log('\n【データサンプル】');
data.forEach(row => {
  console.log(\  ID: \, Name: \, Memo: \\);
});

db.close();
