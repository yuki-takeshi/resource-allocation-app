const Database = require('better-sqlite3');
const db = new Database('./orders.db');

try {
  console.log('古いテーブルをクリーンアップ中...');

  // orders_old が存在する場合は削除
  try {
    db.exec('DROP TABLE IF EXISTS orders_old');
    console.log('✓ orders_old テーブルを削除');
  } catch (e) {
    console.log('⚠ orders_old は存在しません');
  }

  // order_audit_log を再作成
  db.exec('DROP TABLE IF EXISTS order_audit_log');
  db.exec(`
    CREATE TABLE order_audit_log (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      changedField TEXT NOT NULL,
      oldValue TEXT,
      newValue TEXT,
      updatedBy TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    )
  `);
  console.log('✓ order_audit_log テーブルを再作成');

  console.log('\n✓ クリーンアップ完了');
} catch (error) {
  console.error('エラー:', error.message);
} finally {
  db.close();
}
