const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const NEW_CUSTOMERS_EXCLUDE = ['東京芝浦臓器', 'ニヤクシステム', '和光', '二天記'];

const orders = db.prepare('SELECT DISTINCT customer FROM orders WHERE customer IS NOT NULL').all();

const regularCustomers = orders
  .map(o => o.customer)
  .filter(c => !['BPマッチング', 'MRAG', '白地'].includes(c) && !NEW_CUSTOMERS_EXCLUDE.includes(c))
  .sort();

console.log('=== 修正済み顧客名リスト ===');
regularCustomers.forEach((customer, index) => {
  console.log(customer);
});

console.log('\n=== 新規顧客 ===');
const newCustomers = orders.map(o => o.customer).filter(c => NEW_CUSTOMERS_EXCLUDE.includes(c));
newCustomers.forEach(c => console.log(c));

db.close();
