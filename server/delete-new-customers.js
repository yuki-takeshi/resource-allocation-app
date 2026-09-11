const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 外部キー制約を一時的に無効化
db.pragma('foreign_keys = OFF');

const NEW_CUSTOMERS_EXCLUDE = ['東京芝浦臓器', 'ニヤクシステム', '和光', '二天記'];

console.log('=== 削除前 ===');
NEW_CUSTOMERS_EXCLUDE.forEach(customer => {
  const count = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer = ?').get(customer);
  console.log(customer + ': ' + count.count + '件');
});

// 新規顧客のデータを削除
const stmt = db.prepare('DELETE FROM orders WHERE customer = ?');
let deletedCount = 0;
NEW_CUSTOMERS_EXCLUDE.forEach(customer => {
  const result = stmt.run(customer);
  deletedCount += result.changes;
  console.log('削除: ' + customer + ' ' + result.changes + '件');
});

// 外部キー制約を戻す
db.pragma('foreign_keys = ON');

console.log('\n合計: ' + deletedCount + '件削除');

db.close();
