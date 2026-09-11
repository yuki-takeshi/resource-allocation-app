const Database = require('better-sqlite3');
const db = new Database('./orders.db');

const testCustomers = ['G＆J', 'FirstDrop', 'MG', 'SESBP', 'グランド商事', 'カレルチャペック'];
const months2026 = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09'];

console.log('=== 各顧客の注文数（2026-10～2027-09） ===');
testCustomers.forEach(customer => {
  const results = db.prepare('SELECT deliveryMonth, COUNT(*) as count FROM orders WHERE customer = ? GROUP BY deliveryMonth ORDER BY deliveryMonth').all(customer);
  
  console.log(customer + ':');
  if (results.length > 0) {
    let total2026 = 0;
    results.forEach(r => {
      if (months2026.includes(r.deliveryMonth)) {
        total2026 += r.count;
        console.log('  ' + r.deliveryMonth + ': ' + r.count + '件');
      }
    });
    if (total2026 === 0) {
      console.log('  2026-10～2027-09: 0件 ← ダッシュボードに表示されない');
    }
  } else {
    console.log('  注文なし');
  }
});

db.close();
