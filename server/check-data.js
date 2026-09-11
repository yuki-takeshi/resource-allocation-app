const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 月別合計を計算
const months = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09'];

console.log('月別合計（万円単位）:');
let grandTotal = 0;
months.forEach(month => {
  const result = db.prepare('SELECT SUM(amount) as total FROM orders WHERE deliveryMonth = ?').get(month);
  const totalAmount = (result.total || 0) / 10000;
  grandTotal += totalAmount;
  console.log(`${month}: ${totalAmount.toFixed(2)}万円`);
});

console.log(`\n合計: ${grandTotal.toFixed(2)}万円`);

// 顧客別データ数
console.log('\n顧客別レコード数:');
const customerCounts = db.prepare('SELECT customer, COUNT(*) as count FROM orders GROUP BY customer ORDER BY customer').all();
customerCounts.forEach(row => {
  console.log(`${row.customer}: ${row.count}件`);
});

console.log('\n全レコード数:');
const total = db.prepare('SELECT COUNT(*) as count FROM orders').get();
console.log(`合計: ${total.count}件`);

db.close();
