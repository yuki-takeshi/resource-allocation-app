const Database = require('better-sqlite3');
const fs = require('fs');
const csv = require('csv-parse/sync');

const db = new Database('./orders.db');

try {
  console.log('CSVファイルを読み込み中...');
  const fileContent = fs.readFileSync('./19期MQ検討.csv', 'utf-8');

  // CSVをパース
  const records = csv.parse(fileContent, {
    columns: false,
    skip_empty_lines: true
  });

  console.log('監査ログをクリア...');
  db.prepare('DELETE FROM order_audit_log WHERE orderId IN (SELECT id FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ?)').run('2026-10', '2027-09');

  console.log('既存レコードをクリア...');
  db.prepare('DELETE FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ?').run('2026-10', '2027-09');

  const insertStmt = db.prepare(`
    INSERT INTO orders
    (id, name, customer, amount, deliveryMonth, rank, status, created_by, created_at, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const months = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09'];
  const now = new Date().toISOString();
  let totalCount = 0;

  // ヘッダー行をスキップして処理
  for (let i = 2; i < records.length; i++) {
    const row = records[i];

    // データ行かチェック（合計行などはスキップ）
    if (!row[1] || !row[2] || row[0] === '発展事業部ランクA合計') {
      continue;
    }

    const customer = row[1].trim();
    const projectName = row[2].trim();

    // 月別データを抽出（3列目以降）
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const amountStr = row[3 + monthIdx];
      const amount = parseFloat(amountStr) || 0;

      if (amount > 0) {
        const id = `order-${customer}-${projectName}-${months[monthIdx]}-${Date.now()}-${Math.random()}`;
        insertStmt.run(
          id,
          projectName,
          customer,
          Math.round(amount * 100) / 100,  // 万円単位
          months[monthIdx],
          'A',  // ランク
          '進行中',  // ステータス
          '武　勇樹',
          now,
          '武　勇樹',
          now
        );
        totalCount++;
      }
    }
  }

  console.log(`\n✓ ${totalCount}件のレコードを登録しました\n`);

  // 顧客ごとの合計確認
  const result = db.prepare(`
    SELECT customer, COUNT(*) as count, ROUND(SUM(amount), 1) as total
    FROM orders
    WHERE deliveryMonth >= ? AND deliveryMonth <= ?
    GROUP BY customer
    ORDER BY total DESC
  `).all('2026-10', '2027-09');

  console.log('顧客ごとの合計:');
  let grandTotal = 0;
  result.forEach(r => {
    console.log(`  ${r.customer}: ${r.count}件 / ${r.total.toFixed(1)}万円`);
    grandTotal += r.total;
  });

  console.log(`\n全体合計: ${grandTotal.toFixed(1)}万円`);
  console.log(`全体件数: ${totalCount}件`);

} catch (error) {
  console.error('エラー:', error.message);
} finally {
  db.close();
}
