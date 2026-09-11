const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// 2026-10～2027-09の顧客を取得
const months = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09'];
const monthSet = new Set(months);

const orders = db.prepare('SELECT DISTINCT customer FROM orders WHERE customer IS NOT NULL ORDER BY customer').all();

const SALES_CATEGORIES = ['BPマッチング', 'MRAG'];
const LOCKED_CUSTOMERS = ['白地'];
const NEW_CUSTOMERS_EXCLUDE = ['東京芝浦臓器', 'ニヤクシステム', '和光', '二天記'];

const regularCustomers = orders
  .map(o => o.customer)
  .filter(c => !SALES_CATEGORIES.includes(c) && !LOCKED_CUSTOMERS.includes(c) && !NEW_CUSTOMERS_EXCLUDE.includes(c));

console.log('=== 顧客名リスト ===');
regularCustomers.forEach((customer, index) => {
  console.log(customer);
});

db.close();
