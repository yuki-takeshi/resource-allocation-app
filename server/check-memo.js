const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// テーブル一覧を確認
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('【テーブル一覧】');
tables.forEach(t => console.log('  - ' + t.name));

// メモ関連のカラムを確認
try {
  const accountPlans = db.prepare('SELECT COUNT(*) as cnt FROM account_plans').get();
  console.log('\nAccount Plans: ' + accountPlans.cnt + '件');
} catch (e) {
  console.log('\nAccount Plans テーブルなし');
}

db.close();
