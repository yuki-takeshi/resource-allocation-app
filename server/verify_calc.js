const Database = require('better-sqlite3');
const db = new Database('orders.db');

// 2026-09 の計算をシミュレート
const baseMonth = '2026-09';

// 新規受注
const newOrdersStmt = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) as total FROM orders
  WHERE substr(orderDate, 1, 7) = ?
    AND rank IN ('A', 'B')
    AND status IN ('受注確定', '受注済み')
`);
const newOrdersResult = newOrdersStmt.get(baseMonth);
const newOrders = (newOrdersResult.total || 0) / 10000;

// 目標
const targetStmt = db.prepare(`
  SELECT COALESCE(SUM(target), 0) as total FROM targets
  WHERE month = ?
`);
const targetResult = targetStmt.get(baseMonth);
const monthlyTarget = (targetResult.total || 0) / 10000;

// リスク案件
const riskPoolStmt = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) as total FROM orders
  WHERE deliveryMonth = ?
    AND rank IN ('C', 'D', 'E')
    AND status IN ('進行中', '受注確定', '受注済み')
    AND status != '失注'
`);
const riskPoolResult = riskPoolStmt.get(baseMonth);
const riskPoolAmount = (riskPoolResult.total || 0) / 10000;

console.log('=== 2026-09 計算結果（万円） ===');
console.log('新規受注:', newOrders.toFixed(1));
console.log('目標:', monthlyTarget.toFixed(1));
console.log('リスク案件:', riskPoolAmount.toFixed(1));

db.close();
