const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// コマンドライン引数でバックアップファイルを指定
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('使用方法: node restore-data.js <backupファイルパス>');
  console.error('例: node restore-data.js backup_2026-06-30.json');
  process.exit(1);
}

// バックアップファイルを読み込む
const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(__dirname, backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`バックアップファイルが見つかりません: ${backupPath}`);
  process.exit(1);
}

console.log(`バックアップファイルを読み込み中: ${backupPath}`);
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

// SQLiteデータベースを開く
const dbPath = path.join(__dirname, 'orders.db');
const db = new Database(dbPath);

// 既存データをクリア
console.log('\n既存データをクリア中...');
const tables = Object.keys(backupData);
tables.forEach(table => {
  try {
    db.exec(`DELETE FROM ${table}`);
    console.log(`✓ ${table}: クリア完了`);
  } catch (error) {
    console.log(`⚠ ${table}: クリア失敗 (${error.message})`);
  }
});

// バックアップデータを復元
console.log('\nデータを復元中...');
tables.forEach(table => {
  const rows = backupData[table];
  if (!rows || rows.length === 0) {
    console.log(`⚠ ${table}: データなし`);
    return;
  }

  try {
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const stmt = db.prepare(insertSql);

    rows.forEach(row => {
      const values = columns.map(col => row[col]);
      stmt.run(...values);
    });

    console.log(`✓ ${table}: ${rows.length}件復元`);
  } catch (error) {
    console.log(`✗ ${table}: 復元失敗 (${error.message})`);
  }
});

console.log('\n✓ データ復元完了！');
db.close();
