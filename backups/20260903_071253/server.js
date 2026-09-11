const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// セッション設定
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// SQLite Database 初期化
const dbPath = path.join(__dirname, 'orders.db');
const db = new Database(dbPath);

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    amount INTEGER,
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
  );

  CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    month TEXT,
    department TEXT,
    target INTEGER
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    message TEXT,
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS daily_snapshots (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'All',
    totalAmount INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS account_planning_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS account_planning_accounts (
    id TEXT PRIMARY KEY,
    customerName TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    assignee TEXT,
    approachDate TEXT,
    actionPlan TEXT,
    expectedAmount INTEGER DEFAULT 0,
    status TEXT DEFAULT '進行中',
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (categoryId) REFERENCES account_planning_categories(id)
  );

  CREATE TABLE IF NOT EXISTS account_planning_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS account_planning_category_targets (
    categoryId TEXT PRIMARY KEY,
    targetAmount INTEGER DEFAULT 0,
    updated_at TEXT,
    FOREIGN KEY (categoryId) REFERENCES account_planning_categories(id)
  );

  CREATE TABLE IF NOT EXISTS order_audit_log (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    changedField TEXT NOT NULL,
    oldValue TEXT,
    newValue TEXT,
    updatedBy TEXT NOT NULL,
    updatedAt TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );
`);

// 既存テーブルにカラムを追加（存在しない場合のみ）
try {
  const columns = db.prepare("PRAGMA table_info(orders)").all();
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('status')) {
    db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT '進行中'");
  }
  if (!columnNames.includes('lossDate')) {
    db.exec("ALTER TABLE orders ADD COLUMN lossDate TEXT");
  }
  if (!columnNames.includes('lossReason')) {
    db.exec("ALTER TABLE orders ADD COLUMN lossReason TEXT");
  }
  if (!columnNames.includes('created_by')) {
    db.exec("ALTER TABLE orders ADD COLUMN created_by TEXT");
  }
  if (!columnNames.includes('created_at')) {
    db.exec("ALTER TABLE orders ADD COLUMN created_at TEXT");
  }
  if (!columnNames.includes('updated_by')) {
    db.exec("ALTER TABLE orders ADD COLUMN updated_by TEXT");
  }
  if (!columnNames.includes('updated_at')) {
    db.exec("ALTER TABLE orders ADD COLUMN updated_at TEXT");
  }
} catch (error) {
  console.log('スキーマ更新済みまたはスキップ');
}

// デフォルトユーザーを作成（武　勇樹）
try {
  const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get('takeshi_bu');
  if (!existingUser) {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    db.prepare("INSERT INTO users (id, username, password, displayName, created_at) VALUES (?, ?, ?, ?, ?)").run(
      Date.now().toString(),
      'takeshi_bu',
      hashedPassword,
      '武　勇樹',
      new Date().toISOString()
    );
    console.log('デフォルトユーザー（武　勇樹）を作成しました');
  }
} catch (error) {
  console.log('ユーザー初期化スキップ:', error.message);
}

// 既存データに created_by と updated_by を埋める（初回実行時のみ）
try {
  const ordersWithoutCreatedBy = db.prepare("SELECT COUNT(*) as count FROM orders WHERE created_by IS NULL").get();
  if (ordersWithoutCreatedBy.count > 0) {
    db.prepare("UPDATE orders SET created_by = '武　勇樹', updated_by = '武　勇樹' WHERE created_by IS NULL").run();
    console.log(`既存データ ${ordersWithoutCreatedBy.count} 件の created_by, updated_by を '武　勇樹' で更新しました`);
  }
} catch (error) {
  console.log('データ更新スキップ:', error.message);
}

// 初期カテゴリーを作成・更新
try {
  const existingCategories = db.prepare('SELECT COUNT(*) as count FROM account_planning_categories').get();
  if (existingCategories.count === 0) {
    // 新規作成時
    const categories = [
      '大手コンサル・メガSIer',
      'ロイヤルカスタマー',
      'MG/MRAG',
      'エンドユーザー',
      'ServiceNow',
      'その他'
    ];
    const stmt = db.prepare('INSERT INTO account_planning_categories (id, name, created_at) VALUES (?, ?, ?)');
    categories.forEach((name, index) => {
      stmt.run(`cat-${index + 1}`, name, new Date().toISOString());
    });
    console.log('初期カテゴリーを作成しました');
  } else {
    // 既存カテゴリーの更新
    // 「自社プロダクト」を「MG/MRAG」に変更
    const updateStmt = db.prepare("UPDATE account_planning_categories SET name = 'MG/MRAG' WHERE name = '自社プロダクト'");
    updateStmt.run();

    // 「既存ロイヤルカスタマー」を「ロイヤルカスタマー」に変更
    const updateRoyalStmt = db.prepare("UPDATE account_planning_categories SET name = 'ロイヤルカスタマー' WHERE name = '既存ロイヤルカスタマー'");
    updateRoyalStmt.run();

    // 「エンドユーザー」が存在しなければ追加
    const endUserExists = db.prepare("SELECT COUNT(*) as count FROM account_planning_categories WHERE name = 'エンドユーザー'").get();
    if (endUserExists.count === 0) {
      const insertStmt = db.prepare('INSERT INTO account_planning_categories (id, name, created_at) VALUES (?, ?, ?)');
      insertStmt.run(Date.now().toString(), 'エンドユーザー', new Date().toISOString());
      console.log('エンドユーザーカテゴリーを追加しました');
    }

    // 「ServiceNow」が存在しなければ追加
    const serviceNowExists = db.prepare("SELECT COUNT(*) as count FROM account_planning_categories WHERE name = 'ServiceNow'").get();
    if (serviceNowExists.count === 0) {
      const insertStmt = db.prepare('INSERT INTO account_planning_categories (id, name, created_at) VALUES (?, ?, ?)');
      insertStmt.run(Date.now().toString(), 'ServiceNow', new Date().toISOString());
      console.log('ServiceNowカテゴリーを追加しました');
    }

    // 「その他」が存在しなければ追加
    const otherExists = db.prepare("SELECT COUNT(*) as count FROM account_planning_categories WHERE name = 'その他'").get();
    if (otherExists.count === 0) {
      const insertStmt = db.prepare('INSERT INTO account_planning_categories (id, name, created_at) VALUES (?, ?, ?)');
      insertStmt.run(Date.now().toString(), 'その他', new Date().toISOString());
      console.log('その他カテゴリーを追加しました');
    }
  }
} catch (error) {
  console.log('カテゴリー初期化スキップ:', error.message);
}

// ===== 受注残管理 API =====

app.get('/api/orders', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM orders');
    const orders = stmt.all();
    res.json(orders);
  } catch (error) {
    console.error('fetchOrders error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const data = req.body;
    const updatedBy = req.session.displayName || '武　勇樹';
    const updatedAt = new Date().toISOString();

    // 既存レコードを取得
    const existingOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(data.id);

    // 金額を正確に丸める（浮動小数点数の精度問題を解決）
    const preciseAmount = Math.round(data.amount * 100) / 100;

    // 既存の targetAmount を保持、なければ amount と同じにする
    const targetAmount = existingOrder ? existingOrder.targetAmount : preciseAmount;

    // INSERT OR REPLACE を実行
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO orders (id, name, customer, amount, targetAmount, orderDate, deliveryMonth, department, rank, remarks, status, lossDate, lossReason, created_by, created_at, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      data.id,
      data.name,
      data.customer,
      preciseAmount,
      targetAmount,
      data.orderDate,
      data.deliveryMonth,
      data.department,
      data.rank,
      data.remarks || '',
      data.status || '進行中',
      data.lossDate || null,
      data.lossReason || '',
      existingOrder ? existingOrder.created_by : updatedBy,
      existingOrder ? existingOrder.created_at : updatedAt,
      updatedBy,
      updatedAt
    );

    // 変更を監査ログに記録
    if (existingOrder) {
      const fieldsToCheck = ['name', 'customer', 'amount', 'orderDate', 'deliveryMonth', 'department', 'rank', 'remarks', 'status', 'lossDate', 'lossReason'];
      fieldsToCheck.forEach(field => {
        if (existingOrder[field] !== data[field]) {
          const auditStmt = db.prepare(
            'INSERT INTO order_audit_log (id, orderId, changedField, oldValue, newValue, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          auditStmt.run(
            Date.now().toString(),
            data.id,
            field,
            existingOrder[field],
            data[field],
            updatedBy,
            updatedAt
          );
        }
      });
    }

    res.json({ success: true, id: data.id });
  } catch (error) {
    console.error('saveOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/targets', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM targets');
    const targets = stmt.all();
    res.json(targets);
  } catch (error) {
    console.error('fetchTargets error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/targets', (req, res) => {
  try {
    const { id, month, department, target } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO targets (id, month, department, target) VALUES (?, ?, ?, ?)');
    stmt.run(id, month, department, target);
    res.json({ success: true });
  } catch (error) {
    console.error('saveTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/targets/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM targets WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/log', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');
    const logs = stmt.all();
    res.json(logs);
  } catch (error) {
    console.error('fetchLog error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/log', (req, res) => {
  try {
    const { id, timestamp, message, type } = req.body;
    const stmt = db.prepare('INSERT INTO logs (id, timestamp, message, type) VALUES (?, ?, ?, ?)');
    stmt.run(id, timestamp, message, type);
    res.json({ success: true });
  } catch (error) {
    console.error('saveLog error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 日次スナップショット API =====

app.get('/api/snapshots', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM daily_snapshots ORDER BY date ASC');
    const snapshots = stmt.all();
    res.json(snapshots);
  } catch (error) {
    console.error('fetchSnapshots error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/snapshots', (req, res) => {
  try {
    const { id, date, department, totalAmount, created_at } = req.body;
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO daily_snapshots (id, date, department, totalAmount, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, date, department || 'All', totalAmount || 0, created_at);
    res.json({ success: true, id });
  } catch (error) {
    console.error('saveSnapshot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== アカウントプランニング API =====

app.get('/api/account-planning/categories', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM account_planning_categories ORDER BY created_at');
    const categories = stmt.all();
    res.json(categories);
  } catch (error) {
    console.error('fetchCategories error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/account-planning/categories', (req, res) => {
  try {
    const { name } = req.body;
    const id = Date.now().toString();
    const created_at = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO account_planning_categories (id, name, created_at) VALUES (?, ?, ?)');
    stmt.run(id, name, created_at);
    res.json({ id, name, created_at });
  } catch (error) {
    console.error('saveCategory error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/account-planning/categories/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM account_planning_categories WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/account-planning/accounts', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM account_planning_accounts ORDER BY created_at DESC');
    const accounts = stmt.all();
    console.log('取得したアカウント一覧:', accounts);
    res.json(accounts);
  } catch (error) {
    console.error('fetchAccounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/account-planning/accounts', (req, res) => {
  try {
    console.log('受け取った req.body:', JSON.stringify(req.body, null, 2));
    const { id, customerName, categoryId, assignee, approachDate, actionPlan, expectedAmount, status } = req.body;
    const finalExpectedAmount = parseInt(expectedAmount) || 0;
    console.log('抽出したデータ:', { id, customerName, categoryId, assignee, approachDate, actionPlan, expectedAmount, finalExpectedAmount, status });

    const stmt = db.prepare(
      'INSERT OR REPLACE INTO account_planning_accounts (id, customerName, categoryId, assignee, approachDate, actionPlan, expectedAmount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      id || Date.now().toString(),
      customerName,
      categoryId,
      assignee || '',
      approachDate || '',
      actionPlan || '',
      finalExpectedAmount,
      status || '進行中',
      new Date().toISOString(),
      new Date().toISOString()
    );
    res.json({ success: true, id });
  } catch (error) {
    console.error('saveAccount error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/account-planning/accounts/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM account_planning_accounts WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/account-planning/settings/target', (req, res) => {
  try {
    const stmt = db.prepare("SELECT value FROM account_planning_settings WHERE key = 'targetAmount'");
    const result = stmt.get();
    res.json({ targetAmount: result ? parseInt(result.value) : 500000000 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/account-planning/settings/target', (req, res) => {
  try {
    const { targetAmount } = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO account_planning_settings (key, value, updated_at) VALUES (?, ?, ?)");
    stmt.run('targetAmount', targetAmount.toString(), new Date().toISOString());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// カテゴリー目標 API
app.get('/api/account-planning/category-targets', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM account_planning_category_targets');
    const targets = stmt.all();
    res.json(targets);
  } catch (error) {
    console.error('fetchCategoryTargets error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/account-planning/category-targets/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const { targetAmount } = req.body;
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO account_planning_category_targets (categoryId, targetAmount, updated_at) VALUES (?, ?, ?)'
    );
    stmt.run(categoryId, parseInt(targetAmount) || 0, new Date().toISOString());
    res.json({ success: true });
  } catch (error) {
    console.error('saveCategoryTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ログイン機能 API =====

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'パスワードが間違っています' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.displayName = user.displayName;
    res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'ログアウトに失敗しました' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        displayName: req.session.displayName
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ===== 監査ログ API =====

app.get('/api/orders/:id/audit-log', (req, res) => {
  try {
    const { id } = req.params;
    const logs = db.prepare('SELECT * FROM order_audit_log WHERE orderId = ? ORDER BY updatedAt DESC').all(id);
    res.json(logs);
  } catch (error) {
    console.error('fetchAuditLog error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});
