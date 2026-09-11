const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('【データベースの状態確認】\n');

const checks = ['東京芝浦臓器', '千里堂', 'G&J', '和光', 'ニヤクシステム'];

checks.forEach(customer => {
  const records = db.prepare('SELECT customer, amount, deliveryMonth FROM orders WHERE customer = ? ORDER BY deliveryMonth LIMIT 3').all(customer);
  if (records.length > 0) {
    console.log(`${customer}:`);
    records.forEach(r => {
      console.log(`  ${r.deliveryMonth}: ${r.amount}万円`);
    });
  } else {
    console.log(`${customer}: データなし`);
  }
});

db.close();
