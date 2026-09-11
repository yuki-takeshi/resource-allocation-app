const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const orders = db.prepare('SELECT id, customer, deliveryMonth, amount, targetAmount, status, rank FROM orders WHERE customer = ? ORDER BY deliveryMonth').all('FirstDrop');

console.log('=== FirstDropの注文一覧 ===');
if (orders.length > 0) {
  orders.forEach(order => {
    console.log(order.deliveryMonth + ': ' + order.customer + ' / 金額:' + order.amount + ' / 目標:' + order.targetAmount + ' / ステータス:' + order.status + ' / 確度:' + order.rank);
  });
} else {
  console.log('FirstDropの注文はありません');
}

console.log('\n=== 期間別集計 ===');
const by2026 = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer = ? AND (deliveryMonth LIKE "2026-10" OR deliveryMonth LIKE "2026-11" OR deliveryMonth LIKE "2026-12" OR deliveryMonth LIKE "2027-01" OR deliveryMonth LIKE "2027-02" OR deliveryMonth LIKE "2027-03" OR deliveryMonth LIKE "2027-04" OR deliveryMonth LIKE "2027-05" OR deliveryMonth LIKE "2027-06" OR deliveryMonth LIKE "2027-07" OR deliveryMonth LIKE "2027-08" OR deliveryMonth LIKE "2027-09")').get('FirstDrop');

const by2025 = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer = ? AND deliveryMonth LIKE "2025-%"').all('FirstDrop');
const by2026_09 = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer = ? AND deliveryMonth LIKE "2026-01" OR deliveryMonth LIKE "2026-02" OR deliveryMonth LIKE "2026-03" OR deliveryMonth LIKE "2026-04" OR deliveryMonth LIKE "2026-05" OR deliveryMonth LIKE "2026-06" OR deliveryMonth LIKE "2026-07" OR deliveryMonth LIKE "2026-08" OR deliveryMonth LIKE "2026-09"').get('FirstDrop');

console.log('2025年度(10-09): ' + db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer = ? AND (deliveryMonth >= "2025-10" AND deliveryMonth <= "2026-09")').get('FirstDrop').count + '件');
console.log('2026年度(10-09): ' + by2026.count + '件');

db.close();
