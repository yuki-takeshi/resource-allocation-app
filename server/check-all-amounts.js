const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('【全案件の金額確認】\n');

const allOrders = db.prepare(`
  SELECT id, customer, amount, targetAmount, deliveryMonth
  FROM orders
  WHERE status != '失注'
  ORDER BY customer, deliveryMonth
`).all();

// 顧客ごとにグループ化
const byCustomer = {};
allOrders.forEach(order => {
  if (!byCustomer[order.customer]) {
    byCustomer[order.customer] = [];
  }
  byCustomer[order.customer].push(order);
});

// 表示
Object.keys(byCustomer).sort().forEach(customer => {
  const orders = byCustomer[customer];
  console.log(`${customer}:`);
  orders.slice(0, 3).forEach(o => {
    console.log(`  ${o.deliveryMonth}: amount=${o.amount}, target=${o.targetAmount}`);
  });
  if (orders.length > 3) {
    console.log(`  ... 他${orders.length - 3}件`);
  }
  console.log('');
});

db.close();
