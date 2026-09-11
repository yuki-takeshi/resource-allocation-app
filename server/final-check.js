const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('【最終確認：案件金額】\n');

const targets = ['東京芝浦臓器', '千里堂', 'G&J', '和光', 'ニヤクシステム'];
targets.forEach(customer => {
  const order = db.prepare('SELECT amount FROM orders WHERE customer = ? LIMIT 1').get(customer);
  if (order) {
    console.log(`${customer}: ${order.amount}万円 ✓`);
  } else {
    console.log(`${customer}: データなし ✗`);
  }
});

db.close();
