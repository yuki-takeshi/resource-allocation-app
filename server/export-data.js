const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// SQLiteデータベースを開く
const dbPath = path.join(__dirname, 'orders.db');
const db = new Database(dbPath);

// エクスポート対象のテーブル
const tables = [
  'orders',
  'targets',
  'logs',
  'daily_snapshots',
  'account_planning_categories',
  'account_planning_accounts',
  'account_planning_settings',
  'account_planning_category_targets'
];

// データをエクスポート
const exportData = {};
tables.forEach(table => {
  try {
    const stmt = db.prepare(`SELECT * FROM ${table}`);
    const rows = stmt.all();
    exportData[table] = rows;
    console.log(`✓ ${table}: ${rows.length}件`);
  } catch (error) {
    console.log(`⚠ ${table}: テーブルが存在しません`);
  }
});

// JSONファイルとして保存
const exportFileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
const exportPath = path.join(__dirname, exportFileName);

fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');

console.log(`\n✓ バックアップ完了: ${exportPath}`);
console.log(`ファイルサイズ: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);

db.close();
