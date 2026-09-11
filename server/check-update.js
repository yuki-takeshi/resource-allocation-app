const Database = require('better-sqlite3');

const db = new Database('./orders.db');

const result = db.prepare('SELECT customer, amount, targetAmount FROM orders WHERE customer = ? LIMIT 5').all('CSS');

console.log('CSS案件の実績と目標:');
console.log(JSON.stringify(result, null, 2));

db.close();
