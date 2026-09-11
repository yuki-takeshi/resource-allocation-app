// db.js - Database abstraction layer
// SQLite と MySQL の両方をサポート

const path = require('path');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

let db = null;
let dbType = null;

// ===== SQLite 初期化 =====
function initSQLite() {
  const dbPath = path.join(__dirname, 'orders.db');
  console.log(`📦 SQLite Database: ${dbPath}`);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  dbType = 'sqlite';

  // テーブル初期化
  initTables();

  return db;
}

// ===== MySQL 初期化 =====
async function initMySQL() {
  const config = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log(`🗄️  MySQL Database: ${config.user}@${config.host}:${config.port}/${config.database}`);

  try {
    // 接続テスト
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    console.log('✅ MySQL 接続テスト成功');

    // コネクションプール作成
    const pool = await mysql.createPool(config);
    db = pool;
    dbType = 'mysql';

    // テーブル初期化
    await initTablesMySql(pool);

    return pool;
  } catch (error) {
    console.error('❌ MySQL 接続失敗:', error.message);
    console.error('接続設定を確認してください');
    process.exit(1);
  }
}

// ===== SQLite テーブル初期化 =====
function initTables() {
  // Users テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      passwordExpiresAt DATETIME,
      mustChangePassword INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1
    )
  `);

  // Orders テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderDate TEXT NOT NULL,
      customer TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Targets テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,
      month TEXT UNIQUE NOT NULL,
      target REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customer Plan テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_plans (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      planAmount REAL NOT NULL,
      planDate TEXT NOT NULL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ SQLite テーブル初期化完了');
}

// ===== MySQL テーブル初期化 =====
async function initTablesMySql(pool) {
  const connection = await pool.getConnection();

  try {
    // Users テーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        displayName VARCHAR(255) NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        passwordExpiresAt DATETIME,
        mustChangePassword INT DEFAULT 0,
        isActive INT DEFAULT 1,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Orders テーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        orderDate TEXT NOT NULL,
        customer TEXT NOT NULL,
        category TEXT,
        amount DOUBLE NOT NULL,
        status TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_customer (customer),
        INDEX idx_orderDate (orderDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Targets テーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS targets (
        id VARCHAR(255) PRIMARY KEY,
        month VARCHAR(7) UNIQUE NOT NULL,
        target DOUBLE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_month (month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Customer Plan テーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customer_plans (
        id VARCHAR(255) PRIMARY KEY,
        customerName VARCHAR(255) NOT NULL,
        planAmount DOUBLE NOT NULL,
        planDate TEXT NOT NULL,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_customerName (customerName),
        INDEX idx_planDate (planDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ MySQL テーブル初期化完了');
  } catch (error) {
    console.error('❌ MySQL テーブル初期化エラー:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// ===== データベース初期化 =====
async function initDB() {
  if (DATABASE_TYPE === 'mysql') {
    await initMySQL();
  } else {
    initSQLite();
  }

  console.log(`📊 Database Type: ${dbType.toUpperCase()}`);
  return db;
}

// ===== データベース取得 =====
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

// ===== データベース種別確認 =====
function getDBType() {
  return dbType;
}

// ===== SQL 実行ユーティリティ（MySQL用） =====
async function runQuery(query, params = []) {
  if (dbType === 'mysql') {
    const connection = await db.getConnection();
    try {
      const [results] = await connection.execute(query, params);
      return results;
    } finally {
      connection.release();
    }
  } else {
    // SQLite の場合
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      return db.prepare(query).all(...params);
    } else {
      return db.prepare(query).run(...params);
    }
  }
}

module.exports = {
  initDB,
  getDB,
  getDBType,
  runQuery,
  initTables,
  initTablesMySql
};
