const Database = require('better-sqlite3');
const db = new Database('./orders.db');

try {
  console.log('スキーマ変更を開始します...');

  // 既存テーブルをリネーム
  db.exec('ALTER TABLE orders RENAME TO orders_old');

  // 新しいテーブルを作成（amount が REAL）
  db.exec(`
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      customer TEXT,
      amount REAL,
      orderDate TEXT,
      deliveryMonth TEXT,
      department TEXT,
      rank TEXT,
      remarks TEXT,
      status TEXT DEFAULT '進行中',
      lossDate TEXT,
      lossReason TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_by TEXT,
      updated_at TEXT
    )
  `);

  // データをコピー
  db.exec('INSERT INTO orders SELECT * FROM orders_old');

  // 古いテーブルを削除
  db.exec('DROP TABLE orders_old');

  console.log('✓ amount カラムを REAL に変更しました');
} catch (error) {
  console.error('スキーマ変更エラー:', error.message);
} finally {
  db.close();
}
