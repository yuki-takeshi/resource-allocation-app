const Database = require('better-sqlite3');

const db = new Database('./orders.db');

const bpData = [
  { month: '2026-10', amount: 180 },
  { month: '2026-11', amount: 190 },
  { month: '2026-12', amount: 200 },
  { month: '2027-01', amount: 210 },
  { month: '2027-02', amount: 220 },
  { month: '2027-03', amount: 230 },
  { month: '2027-04', amount: 205 },
  { month: '2027-05', amount: 215 },
  { month: '2027-06', amount: 225 },
  { month: '2027-07', amount: 235 },
  { month: '2027-08', amount: 245 },
  { month: '2027-09', amount: 245 }
];

const mragData = [
  { month: '2026-10', amount: 35 },
  { month: '2026-11', amount: 1 },
  { month: '2026-12', amount: 1 },
  { month: '2027-01', amount: 63 },
  { month: '2027-02', amount: 3 },
  { month: '2027-03', amount: 3 },
  { month: '2027-04', amount: 72 },
  { month: '2027-05', amount: 4 },
  { month: '2027-06', amount: 5 },
  { month: '2027-07', amount: 5 },
  { month: '2027-08', amount: 4 },
  { month: '2027-09', amount: 4 }
];

const now = new Date().toISOString();
const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO orders
  (id, name, customer, amount, deliveryMonth, rank, status, created_by, created_at, updated_by, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// 監査ログと注文を削除
db.prepare('DELETE FROM order_audit_log WHERE orderId IN (SELECT id FROM orders WHERE customer IN (?, ?))').run('BPマッチング', 'MRAG');
db.prepare('DELETE FROM orders WHERE customer IN (?, ?)').run('BPマッチング', 'MRAG');

let count = 0;

bpData.forEach(data => {
  const id = 'bp-' + data.month;
  insertStmt.run(id, 'BPマッチング', 'BPマッチング', data.amount, data.month, 'A', '進行中', '武　勇樹', now, '武　勇樹', now);
  count++;
});

mragData.forEach(data => {
  const id = 'mrag-' + data.month;
  insertStmt.run(id, 'MRAG', 'MRAG', data.amount, data.month, 'A', '進行中', '武　勇樹', now, '武　勇樹', now);
  count++;
});

console.log(`✓ ${count}件のレコードを登録しました`);
db.close();
