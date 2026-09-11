const Database = require('better-sqlite3');

const db = new Database('./orders.db');

// 2026-10～2027-09期間の合計
const result = db.prepare(`
  SELECT
    customer,
    ROUND(SUM(amount), 1) as total
  FROM orders
  WHERE deliveryMonth BETWEEN '2026-10' AND '2027-09'
    AND status != '失注'
  GROUP BY customer
  ORDER BY total DESC
`).all();

console.log('顧客別合計：');
let grandTotal = 0;
result.forEach(r => {
  console.log(`  ${r.customer}: ${r.total}万円`);
  grandTotal += r.total;
});

console.log(`\n全体合計: ${grandTotal.toFixed(1)}万円`);

// 白地のみ
const shirachiResult = db.prepare(`
  SELECT ROUND(SUM(amount), 1) as total
  FROM orders
  WHERE customer = '白地'
    AND deliveryMonth BETWEEN '2026-10' AND '2027-09'
    AND status != '失注'
`).get();

console.log(`\n白地合計: ${shirachiResult?.total || 0}万円`);

// 通常顧客（営業部と新規現場・白地を除外）
const excludedCustomers = ['新規現場', '白地', 'BPマッチング', 'MRAG'];
const existingBusinessResult = db.prepare(`
  SELECT ROUND(SUM(amount), 1) as total
  FROM orders
  WHERE deliveryMonth BETWEEN '2026-10' AND '2027-09'
    AND status != '失注'
    AND customer NOT IN ('新規現場', '白地', 'BPマッチング', 'MRAG')
`).get();

console.log(`\n既存ビジネス計（通常顧客のみ）: ${existingBusinessResult?.total || 0}万円`);

// 開発事業部合計（通常顧客 + 白地）
const devTotalResult = db.prepare(`
  SELECT ROUND(SUM(amount), 1) as total
  FROM orders
  WHERE deliveryMonth BETWEEN '2026-10' AND '2027-09'
    AND status != '失注'
    AND customer NOT IN ('新規現場', 'BPマッチング', 'MRAG')
`).get();

console.log(`開発事業部合計（通常 + 白地）: ${devTotalResult?.total || 0}万円`);

db.close();
