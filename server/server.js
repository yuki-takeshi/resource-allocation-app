const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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

// ===== ユーティリティ関数 =====

// ランダムパスワード生成（16文字、大文字・小文字・数字・特殊文字を含む）
function generateRandomPassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+';
  let password = '';
  const charArray = chars.split('');
  for (let i = 0; i < length; i++) {
    password += charArray[Math.floor(Math.random() * charArray.length)];
  }
  return password;
}

// メール送信関数
function sendPasswordEmail(email, displayName, password, temporaryPassword) {
  const mailContent = `
【${displayName} 様へ】
resource-allocation-app へようこそ。

以下の情報でログインしてください:
- ユーザー名: ${email}
- 初回パスワード: ${temporaryPassword}

ログイン後、パスワード変更画面が表示されます。新しいパスワードを設定してください。

⚠️ 注意: このパスワードは7日間有効です。期限切れの場合は再発行が必要です。

質問またはサポートが必要な場合は、管理者にお問い合わせください。
  `;

  // テスト環境：メール設定がない場合はコンソール出力
  if (!process.env.SMTP_USER) {
    console.log('【メール送信シミュレーション】');
    console.log(`To: ${email}`);
    console.log(`Subject: resource-allocation-app 初回パスワード`);
    console.log(mailContent);
    return Promise.resolve();
  }

  // 本番環境：実際にメール送信
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'resource-allocation-app 初回パスワード',
    html: `
      <h2>${displayName} 様へ</h2>
      <p>resource-allocation-app へようこそ。</p>
      <p>以下の情報でログインしてください:</p>
      <ul>
        <li><strong>ユーザー名:</strong> ${email}</li>
        <li><strong>初回パスワード:</strong> <code>${temporaryPassword}</code></li>
      </ul>
      <p>ログイン後、パスワード変更画面が表示されます。新しいパスワードを設定してください。</p>
      <p><strong>注意:</strong> このパスワードは7日間有効です。期限切れの場合は再発行が必要です。</p>
      <p>質問またはサポートが必要な場合は、管理者にお問い合わせください。</p>
    `
  };

  return transporter.sendMail(mailOptions).catch(error => {
    console.error('メール送信エラー:', error);
    // メール送信失敗時も続行（ただしログに記録）
  });
}

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

// users テーブルにカラムを追加（存在しない場合のみ）
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const userColumnNames = userColumns.map(c => c.name);

  if (!userColumnNames.includes('email')) {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  }
  if (!userColumnNames.includes('passwordExpiresAt')) {
    db.exec("ALTER TABLE users ADD COLUMN passwordExpiresAt TEXT");
  }
  if (!userColumnNames.includes('mustChangePassword')) {
    db.exec("ALTER TABLE users ADD COLUMN mustChangePassword INTEGER DEFAULT 1");
  }
  if (!userColumnNames.includes('isActive')) {
    db.exec("ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1");
  }
} catch (error) {
  console.log('users テーブル スキーマ更新済みまたはスキップ');
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

    // 既存の targetAmount を保持、新規登録の場合は 0 に設定
    const targetAmount = existingOrder ? existingOrder.targetAmount : (data.targetAmount !== undefined ? data.targetAmount : 0);

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

// ===== STRAC ダッシュボード API =====

app.get('/api/strac/dashboard', (req, res) => {
  try {
    const { baseMonth, spanMonths = 3 } = req.query;

    if (!baseMonth) {
      return res.status(400).json({ error: 'baseMonth parameter required' });
    }

    const [baseYear, baseMonthNum] = baseMonth.split('-').map(Number);
    const spanCount = parseInt(spanMonths);

    // 指定期間のデータを計算
    const months = [];
    let carryover = 0; // 初月は0から開始

    for (let i = 0; i < spanCount; i++) {
      let year = baseYear;
      let month = baseMonthNum + i;

      // 月の繰り越し処理
      if (month > 12) {
        year += Math.floor((month - 1) / 12);
        month = ((month - 1) % 12) + 1;
      }

      const currentMonth = `${year}-${String(month).padStart(2, '0')}`;

      // 1. 当月の新規受注（受注日が当月、A/Bのみ、ステータス問わず）を取得（orders は円単位）
      const newOrdersStmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM orders
        WHERE substr(orderDate, 1, 7) = ?
          AND rank IN ('A', 'B')
      `);
      const newOrdersResult = newOrdersStmt.get(currentMonth);
      const newOrders = (newOrdersResult.total || 0) / 10000; // 円から万円に変換

      // 2. 当月の目標（targets テーブルから取得、円単位）
      const targetStmt = db.prepare(`
        SELECT COALESCE(SUM(target), 0) as total FROM targets
        WHERE month = ?
      `);
      const targetResult = targetStmt.get(currentMonth);
      const monthlyTarget = (targetResult.total || 0) / 10000; // 円から万円に変換

      // 3. 当月末残を計算
      const totalIN = carryover + newOrders;
      const endBalance = totalIN - monthlyTarget;

      // 4. リスク案件プール（C/D/E で当月が納期の案件）を取得（円単位）
      const riskPoolStmt = db.prepare(`
        SELECT id, name, customer, amount, rank, deliveryMonth
        FROM orders
        WHERE deliveryMonth = ?
          AND rank IN ('C', 'D', 'E')
          AND status IN ('進行中', '受注確定', '受注済み')
          AND status != '失注'
        ORDER BY rank ASC, amount DESC
      `);
      const riskPool = riskPoolStmt.all(currentMonth);
      const riskPoolAmount = riskPool.reduce((sum, o) => sum + (o.amount / 10000), 0); // 円から万円に変換

      months.push({
        month: currentMonth,
        carryover: Math.round(carryover * 100) / 100, // 既に万円単位
        newOrders: Math.round(newOrders * 100) / 100,
        monthlyTarget: Math.round(monthlyTarget * 100) / 100,
        totalIN: Math.round(totalIN * 100) / 100,
        endBalance: Math.round(endBalance * 100) / 100,
        riskPool: riskPool.map(o => ({
          ...o,
          amount: Math.round((o.amount / 10000) * 100) / 100 // 円から万円に変換
        })),
        riskPoolAmount: Math.round(riskPoolAmount * 100) / 100,
        achievementRate: monthlyTarget > 0 ? Math.round((totalIN / monthlyTarget) * 1000) / 10 : 0 // パーセント
      });

      // 翌月へのローリング（マイナス値も繰り越す）
      carryover = endBalance;
    }

    // 3ヶ月合計サマリー（シンプル計算）
    const summary = {
      totalCarryover: months.length > 0 ? months[0].carryover : 0, // 最初の月の前月末残
      totalNewOrders: months.reduce((sum, m) => sum + m.newOrders, 0), // 3ヶ月の新規受注合計
      totalTarget: months.reduce((sum, m) => sum + m.monthlyTarget, 0), // 3ヶ月の目標合計
      totalEndBalance: months.length > 0 ? months[months.length - 1].endBalance : 0, // 最後の月の期末残
      totalRiskPoolAmount: months.reduce((sum, m) => sum + m.riskPoolAmount, 0), // リスク案件合計
      averageAchievementRate: months.length > 0 ? months[months.length - 1].achievementRate : 0 // 最後の月の達成率
    };

    // 3ヶ月の新規受注案件一覧（A/B）を取得
    const endMonth = `${baseYear}-${String(baseMonthNum + spanCount - 1).padStart(2, '0')}`;
    let endYear = baseYear;
    let endMonthNum = baseMonthNum + spanCount - 1;
    if (endMonthNum > 12) {
      endYear += Math.floor((endMonthNum - 1) / 12);
      endMonthNum = ((endMonthNum - 1) % 12) + 1;
    }
    const rangeEndMonth = `${endYear}-${String(endMonthNum).padStart(2, '0')}`;

    const newOrdersStmt = db.prepare(`
      SELECT id, name, customer, amount, rank, orderDate, deliveryMonth
      FROM orders
      WHERE substr(orderDate, 1, 7) >= ? AND substr(orderDate, 1, 7) <= ?
        AND rank IN ('A', 'B')
      ORDER BY orderDate DESC
    `);
    const newOrdersList = newOrdersStmt.all(baseMonth, rangeEndMonth);

    res.json({
      baseMonth,
      spanMonths: spanCount,
      months,
      summary,
      newOrdersList: newOrdersList.map(o => ({
        ...o,
        amount: Math.round((o.amount / 10000) * 100) / 100 // 円から万円に変換
      }))
    });
  } catch (error) {
    console.error('STRACダッシュボード error:', error);
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

    // パスワード有効期限チェック
    if (user.passwordExpiresAt) {
      const expiresAt = new Date(user.passwordExpiresAt);
      const now = new Date();
      if (now > expiresAt) {
        return res.status(401).json({ error: 'パスワードの有効期限が切れています。管理者にパスワードリセットを依頼してください。', passwordExpired: true });
      }
    }

    // ユーザーが有効か確認
    if (!user.isActive) {
      return res.status(401).json({ error: 'このユーザーは無効化されています' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.displayName = user.displayName;
    req.session.mustChangePassword = user.mustChangePassword;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        mustChangePassword: user.mustChangePassword
      }
    });
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

// ===== 管理画面 API =====

// 1. 注文情報の管理

// 注文一覧取得
app.get('/api/admin/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY orderDate DESC').all();
    const formattedOrders = orders.map(order => ({
      ...order,
      amount: order.amount ? order.amount / 10000 : 0  // 円を万円に変換
    }));
    res.json(formattedOrders);
  } catch (error) {
    console.error('fetchAdminOrders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 注文を修正
app.put('/api/admin/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, customer, amount, orderDate, deliveryMonth, department, rank, remarks, status, lossDate, lossReason } = req.body;
    const userId = req.session.userId;

    const amountInYen = amount !== null && amount !== undefined ? Math.round(amount * 10000) : null;

    db.prepare(`
      UPDATE orders
      SET name = ?, customer = ?, amount = ?, orderDate = ?, deliveryMonth = ?,
          department = ?, rank = ?, remarks = ?, status = ?, lossDate = ?, lossReason = ?,
          updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, customer, amountInYen, orderDate, deliveryMonth,
      department, rank, remarks, status, lossDate, lossReason,
      userId, new Date().toISOString(), id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('updateAdminOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 注文を削除
app.delete('/api/admin/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    db.prepare('DELETE FROM order_audit_log WHERE orderId = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAdminOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. 月別目標の管理

// 目標一覧取得
app.get('/api/admin/targets', (req, res) => {
  try {
    const targets = db.prepare('SELECT * FROM targets ORDER BY month DESC').all();
    const formattedTargets = targets.map(target => ({
      ...target,
      target: target.target ? target.target / 10000 : 0  // 円を万円に変換
    }));
    res.json(formattedTargets);
  } catch (error) {
    console.error('fetchAdminTargets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 目標を修正
app.put('/api/admin/targets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { month, department, target } = req.body;

    const targetInYen = target !== null && target !== undefined ? Math.round(target * 10000) : 0;

    db.prepare(`
      UPDATE targets
      SET month = ?, department = ?, target = ?
      WHERE id = ?
    `).run(month, department, targetInYen, id);

    res.json({ success: true });
  } catch (error) {
    console.error('updateAdminTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 目標を作成
app.post('/api/admin/targets', (req, res) => {
  try {
    const { month, department, target } = req.body;
    const id = require('crypto').randomUUID();
    const targetInYen = target !== null && target !== undefined ? Math.round(target * 10000) : 0;

    db.prepare(`
      INSERT INTO targets (id, month, department, target)
      VALUES (?, ?, ?, ?)
    `).run(id, month, department, targetInYen);

    res.json({ success: true, id });
  } catch (error) {
    console.error('createAdminTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 目標を削除
app.delete('/api/admin/targets/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM targets WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAdminTarget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. 顧客計画の管理

// 顧客計画一覧取得
app.get('/api/admin/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT aac.*, apc.name as categoryName
      FROM account_planning_accounts aac
      LEFT JOIN account_planning_categories apc ON aac.categoryId = apc.id
      ORDER BY aac.created_at DESC
    `).all();

    const formattedCustomers = customers.map(customer => ({
      ...customer,
      expectedAmount: customer.expectedAmount ? customer.expectedAmount / 10000 : 0  // 円を万円に変換
    }));
    res.json(formattedCustomers);
  } catch (error) {
    console.error('fetchAdminCustomers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 顧客計画を修正
app.put('/api/admin/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, categoryId, assignee, approachDate, actionPlan, expectedAmount, status } = req.body;

    const expectedAmountInYen = expectedAmount !== null && expectedAmount !== undefined ? Math.round(expectedAmount * 10000) : 0;

    db.prepare(`
      UPDATE account_planning_accounts
      SET customerName = ?, categoryId = ?, assignee = ?, approachDate = ?,
          actionPlan = ?, expectedAmount = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      customerName, categoryId, assignee, approachDate,
      actionPlan, expectedAmountInYen, status, new Date().toISOString(), id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('updateAdminCustomer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 顧客計画を削除
app.delete('/api/admin/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM account_planning_accounts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAdminCustomer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// カテゴリ一覧取得
app.get('/api/admin/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM account_planning_categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    console.error('fetchAdminCategories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ユーザー管理 API =====

// ユーザー一覧取得
app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, displayName, isActive, passwordExpiresAt, mustChangePassword, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('fetchAdminUsers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 新規ユーザー作成
app.post('/api/admin/users', (req, res) => {
  try {
    const { username, email, displayName } = req.body;

    // ユーザーが既に存在するか確認
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: 'このユーザー名またはメールアドレスは既に登録されています' });
    }

    // ランダムパスワード生成
    const temporaryPassword = generateRandomPassword();
    const hashedPassword = bcrypt.hashSync(temporaryPassword, 10);

    // パスワード有効期限（7日後）
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const userId = require('crypto').randomUUID();

    db.prepare(`
      INSERT INTO users (id, username, email, password, displayName, passwordExpiresAt, mustChangePassword, isActive, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username,
      email,
      hashedPassword,
      displayName,
      expiresAt.toISOString(),
      1, // mustChangePassword = true
      1, // isActive = true
      now.toISOString()
    );

    // メール送信
    sendPasswordEmail(email, displayName, null, temporaryPassword);

    res.json({ success: true, userId, temporaryPassword, message: 'ユーザーが作成され、初回パスワードがメールで送信されました' });
  } catch (error) {
    console.error('createAdminUser error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ユーザー情報更新
app.put('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, isActive } = req.body;

    db.prepare(`
      UPDATE users
      SET displayName = ?, isActive = ?
      WHERE id = ?
    `).run(displayName, isActive, id);

    res.json({ success: true });
  } catch (error) {
    console.error('updateAdminUser error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ユーザー削除
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAdminUser error:', error);
    res.status(500).json({ error: error.message });
  }
});

// パスワードリセット
app.post('/api/admin/users/:id/reset-password', (req, res) => {
  try {
    const { id } = req.params;

    // ユーザー情報取得
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // ランダムパスワード生成
    const temporaryPassword = generateRandomPassword();
    const hashedPassword = bcrypt.hashSync(temporaryPassword, 10);

    // パスワード有効期限（7日後）
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    db.prepare(`
      UPDATE users
      SET password = ?, passwordExpiresAt = ?, mustChangePassword = 1
      WHERE id = ?
    `).run(hashedPassword, expiresAt.toISOString(), id);

    // メール送信
    sendPasswordEmail(user.email, user.displayName, null, temporaryPassword);

    res.json({ success: true, temporaryPassword, message: 'パスワードがリセットされ、新しい初回パスワードがメールで送信されました' });
  } catch (error) {
    console.error('resetAdminUserPassword error:', error);
    res.status(500).json({ error: error.message });
  }
});

// パスワード変更（ユーザー自身）
app.post('/api/auth/change-password', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'ログインが必要です' });
    }

    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 現在のパスワード確認
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '現在のパスワードが間違っています' });
    }

    // 新しいパスワード設定
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE users
      SET password = ?, mustChangePassword = 0
      WHERE id = ?
    `).run(hashedPassword, req.session.userId);

    res.json({ success: true, message: 'パスワードが変更されました' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});
