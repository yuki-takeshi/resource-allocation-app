const Database = require("better-sqlite3");
const db = new Database("./orders.db");

// 2026-10月 AB確度の合計
const oct2026AB = db.prepare("SELECT COUNT(*) as count, ROUND(SUM(COALESCE(amount, 0)), 1) as amount_sum FROM orders WHERE deliveryMonth = '2026-10' AND rank IN ('A', 'B')").get();

console.log("=== 2026-10月 AB確度 ===");
console.log("実績合計:", oct2026AB.amount_sum);

// 2025-10月 AB確度のデータがないか確認
const oct2025AB = db.prepare("SELECT COUNT(*) as count, ROUND(SUM(COALESCE(amount, 0)), 1) as amount_sum FROM orders WHERE deliveryMonth = '2025-10' AND rank IN ('A', 'B')").get();

console.log("=== 2025-10月 AB確度 ===");
console.log("実績合計:", oct2025AB.amount_sum);

console.log("=== 差分分析 ===");
console.log("期待値（月別合計AB）: 1673.3");
console.log("実際の累計: 2388.3");
console.log("差分: " + (2388.3 - 1673.3));

if (oct2026AB.amount_sum && oct2025AB.amount_sum) {
  console.log("2026-10 + 2025-10の合計:", oct2026AB.amount_sum + oct2025AB.amount_sum);
}

// 全月のデータを見る
const allMonths = db.prepare("SELECT deliveryMonth, ROUND(SUM(COALESCE(amount, 0)), 1) as amount_sum FROM orders WHERE rank IN ('A', 'B') GROUP BY deliveryMonth ORDER BY deliveryMonth").all();

console.log("\n=== 全月AB確度の実績 ===");
allMonths.forEach(row => {
  console.log(row.deliveryMonth + ": " + row.amount_sum);
});

db.close();
