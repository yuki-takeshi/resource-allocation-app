const Database = require("better-sqlite3");
const db = new Database("./orders.db");

console.log("【修正開始】\n");

// 武蔵野10月スポット：目標を19万円に修正
const musashinoSpotId = "order-武蔵野-スポット-2026-10-1788257290544-0.5088898519221694";
const stmt1 = db.prepare("UPDATE orders SET targetAmount = ? WHERE id = ?");
const result1 = stmt1.run(19, musashinoSpotId);
console.log(`✓ 武蔵野10月スポット: 目標を19万円に修正 (${result1.changes}件)`);

// INI11月JAFナビサイト通常保守：目標を16.0万円に修正
const iniJafId = "order-INI-JAFナビサイト通常保守-2026-11-1788257290919-0.421506559377244";
const stmt2 = db.prepare("UPDATE orders SET targetAmount = ? WHERE id = ?");
const result2 = stmt2.run(16.0, iniJafId);
console.log(`✓ INI11月JAFナビサイト通常保守: 目標を16.0万円に修正 (${result2.changes}件)`);

// INI11月スポット：目標を19.0万円に修正
const iniSpotId = "order-INI-スポット-2026-11-1788257290961-0.29357679463832087";
const stmt3 = db.prepare("UPDATE orders SET targetAmount = ? WHERE id = ?");
const result3 = stmt3.run(19.0, iniSpotId);
console.log(`✓ INI11月スポット: 目標を19.0万円に修正 (${result3.changes}件)`);

console.log("\n【修正完了】");

db.close();
