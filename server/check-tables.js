const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('テーブル一覧:');
tables.forEach(t => console.log(`  - ${t.name}`));

db.close();
