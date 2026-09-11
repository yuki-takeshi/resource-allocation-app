const Database = require('better-sqlite3');
const db = new Database('./orders.db');

console.log('2026-10～2027-09 の案件一覧:');
const results = db.prepare(`
  SELECT customer, name, amount, deliveryMonth, created_at
  FROM orders
  WHERE deliveryMonth >= '2026-10' AND deliveryMonth <= '2027-09'
  ORDER BY deliveryMonth, customer, name
`).all();

console.log(`\n全レコード数: ${results.length}件\n`);

const grouped = {};
results.forEach(r => {
  if (!grouped[r.deliveryMonth]) grouped[r.deliveryMonth] = [];
  grouped[r.deliveryMonth].push(r);
});

Object.keys(grouped).sort().forEach(month => {
  console.log(`${month}: ${grouped[month].length}件`);
  grouped[month].forEach(r => {
    console.log(`  ${r.customer} - ${r.name}: ${r.amount}万円 (作成: ${r.created_at?.substring(0, 10)})`);
  });
});

db.close();
