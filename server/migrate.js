// SQLite → MySQL データ移行スクリプト
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
require('dotenv').config();
const path = require('path');

async function migrate() {
  console.log('🔄 データ移行を開始します...\n');

  // SQLite から データを読み込む
  const sqlitePath = path.join(__dirname, 'orders.db');
  const sqliteDb = new Database(sqlitePath);

  console.log('📂 SQLite からデータを読み込み中...');

  const orders = sqliteDb.prepare('SELECT * FROM orders').all();
  const targets = sqliteDb.prepare('SELECT * FROM targets').all();
  const accountPlanningAccounts = sqliteDb.prepare('SELECT * FROM account_planning_accounts').all();
  const accountPlanningCategories = sqliteDb.prepare('SELECT * FROM account_planning_categories').all();

  console.log(`  ✓ Orders: ${orders.length} 件`);
  console.log(`  ✓ Targets: ${targets.length} 件`);
  console.log(`  ✓ Account Planning Accounts: ${accountPlanningAccounts.length} 件`);
  console.log(`  ✓ Account Planning Categories: ${accountPlanningCategories.length} 件\n`);

  // MySQL に接続
  console.log('🗄️  MySQL に接続中...');
  const pool = await mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const connection = await pool.getConnection();
  console.log('✓ MySQL 接続成功\n');

  try {
    // テーブル作成（存在しなければ作成）
    console.log('📋 テーブル作成中...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`customer\` VARCHAR(255),
        \`amount\` INT,
        \`orderDate\` TEXT,
        \`deliveryMonth\` TEXT,
        \`department\` VARCHAR(255),
        \`rank\` VARCHAR(255),
        \`remarks\` TEXT,
        \`status\` VARCHAR(255) DEFAULT '進行中',
        \`lossDate\` TEXT,
        \`lossReason\` TEXT,
        \`created_by\` VARCHAR(255),
        \`created_at\` TEXT,
        \`updated_by\` VARCHAR(255),
        \`updated_at\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`targets\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`month\` VARCHAR(10),
        \`department\` VARCHAR(255),
        \`target\` INT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`account_planning_categories\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`created_at\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`account_planning_accounts\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`customerName\` VARCHAR(255) NOT NULL,
        \`categoryId\` VARCHAR(255) NOT NULL,
        \`assignee\` VARCHAR(255),
        \`approachDate\` TEXT,
        \`actionPlan\` TEXT,
        \`expectedAmount\` INT DEFAULT 0,
        \`status\` VARCHAR(255) DEFAULT '進行中',
        \`created_at\` TEXT,
        \`updated_at\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ テーブル作成完了\n');

    // テーブルをクリア（DELETE を使用 - DROP 権限がないため）
    console.log('🧹 既存データをクリア中...');
    await connection.execute('DELETE FROM `orders`').catch(() => {});
    await connection.execute('DELETE FROM `targets`').catch(() => {});
    await connection.execute('DELETE FROM `account_planning_accounts`').catch(() => {});
    await connection.execute('DELETE FROM `account_planning_categories`').catch(() => {});
    console.log('✓ テーブルクリア完了\n');

    // Orders をインポート
    console.log('📥 Orders をインポート中...');
    for (const order of orders) {
      const query = `
        INSERT INTO orders
        (\`id\`, \`name\`, \`customer\`, \`amount\`, \`orderDate\`, \`deliveryMonth\`, \`department\`, \`rank\`, \`remarks\`, \`status\`, \`lossDate\`, \`lossReason\`, \`created_by\`, \`created_at\`, \`updated_by\`, \`updated_at\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.execute(query, [
        order.id, order.name, order.customer, order.amount, order.orderDate, order.deliveryMonth,
        order.department, order.rank, order.remarks, order.status, order.lossDate, order.lossReason,
        order.created_by, order.created_at, order.updated_by, order.updated_at
      ]);
    }
    console.log(`✓ Orders インポート完了: ${orders.length} 件\n`);

    // Targets をインポート
    console.log('📥 Targets をインポート中...');
    for (const target of targets) {
      const query = `
        INSERT INTO targets (id, month, department, target)
        VALUES (?, ?, ?, ?)
      `;
      await connection.execute(query, [target.id, target.month, target.department, target.target]);
    }
    console.log(`✓ Targets インポート完了: ${targets.length} 件\n`);

    // Account Planning Categories をインポート
    console.log('📥 Account Planning Categories をインポート中...');
    for (const category of accountPlanningCategories) {
      const query = `
        INSERT INTO account_planning_categories (id, name, created_at)
        VALUES (?, ?, ?)
      `;
      await connection.execute(query, [category.id, category.name, category.created_at]);
    }
    console.log(`✓ Categories インポート完了: ${accountPlanningCategories.length} 件\n`);

    // Account Planning Accounts をインポート
    console.log('📥 Account Planning Accounts をインポート中...');
    for (const account of accountPlanningAccounts) {
      const query = `
        INSERT INTO account_planning_accounts
        (id, customerName, categoryId, assignee, approachDate, actionPlan, expectedAmount, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.execute(query, [
        account.id, account.customerName, account.categoryId, account.assignee, account.approachDate,
        account.actionPlan, account.expectedAmount, account.status, account.created_at, account.updated_at
      ]);
    }
    console.log(`✓ Accounts インポート完了: ${accountPlanningAccounts.length} 件\n`);

    console.log('✅ データ移行が完了しました！');
    console.log('💾 すべてのデータが MySQL に正常に移行されました。\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('❌ 移行スクリプトエラー:', error);
  process.exit(1);
});
