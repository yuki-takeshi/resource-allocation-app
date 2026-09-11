const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('=== Snapshots テーブルの内容 ===');
const snapshots = db.prepare('SELECT * FROM snapshots ORDER BY date DESC LIMIT 5').all();

if (snapshots.length > 0) {
  snapshots.forEach(s => {
    console.log('\nDate: ' + s.date);
    console.log('totalAmount: ' + s.totalAmount + ' (型: ' + typeof s.totalAmount + ')');
    console.log('データをそのまま表示: ' + Math.floor(s.totalAmount) + 'M');
    console.log('データを10000で割った場合: ' + Math.floor(s.totalAmount / 10000) + 'M');
  });
} else {
  console.log('スナップショットデータがありません');
}

db.close();
