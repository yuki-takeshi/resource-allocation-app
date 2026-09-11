const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// Googleシートのデータを案件ごとのレコードに変換
const data = [
  { customer: '武蔵野', name: 'DX', rank: 'A', months: { 10: 1.31, 11: 1.31, 12: 1.31, 1: 1.31, 2: 1.31, 3: 1.31, 4: 1.31, 5: 1.31, 6: 1.31, 7: 1.31, 8: 1.31, 9: 1.31 } },
  { customer: '武蔵野', name: 'システム部', rank: 'A', months: { 10: 0.76, 11: 0.76, 12: 0.76, 1: 0.76, 2: 0.76, 3: 0.76, 4: 0.76, 5: 0.76, 6: 0.76, 7: 0.76, 8: 0.76, 9: 0.76 } },
  { customer: '武蔵野', name: 'マイページ', rank: 'A', months: { 10: 1.54, 11: 1.54, 12: 1.54, 1: 1.54, 2: 1.54, 3: 1.54, 4: 1.54, 5: 1.54, 6: 1.54, 7: 1.54, 8: 1.54, 9: 1.54 } },
  { customer: '武蔵野', name: '外販マイページ', rank: 'A', months: { 10: 0.62, 11: 0.62, 12: 0.62, 1: 0.62, 2: 0.62, 3: 0.62, 4: 0.62, 5: 0.62, 6: 0.62, 7: 0.62, 8: 0.62, 9: 0.62 } },
  { customer: '武蔵野', name: '経理系', rank: 'A', months: { 10: 0.76, 11: 0.76, 12: 0.76, 1: 0.76, 2: 0.76, 3: 0.76, 4: 0.76, 5: 0.76, 6: 0.76, 7: 0.76, 8: 0.76, 9: 0.76 } },
  { customer: '武蔵野', name: 'スポット', rank: 'C', months: { 5: 0.23, 8: 4.20 } },
  { customer: 'CTC', name: '自動販売機ルート・補充計画調整システム構築', rank: 'A', months: { 10: 0.76, 11: 0.76, 12: 0.76, 1: 0.76, 2: 0.76, 3: 0.76, 4: 0.76, 5: 0.76, 6: 0.76, 7: 0.76, 8: 0.76, 9: 0.76 } },
  { customer: 'PBR', name: 'PBR LENDING保守業務', rank: 'A', months: { 10: 0.18, 11: 0.18, 12: 0.18, 1: 0.18, 2: 0.18, 3: 0.18, 4: 0.18, 5: 0.18, 6: 0.18, 7: 0.18, 8: 0.18, 9: 0.18 } },
  { customer: 'マークシティー', name: 'マイページ工程管理保守', rank: 'A', months: { 10: 0.01, 11: 0.01, 12: 0.01, 1: 0.01, 2: 0.01, 3: 0.01, 4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01 } },
  { customer: 'マークシティー', name: 'スポット', rank: 'C', months: { 12: 0.12, 4: 0.12 } },
  { customer: '光マーク', name: 'マイページ工程管理保守', rank: 'A', months: { 12: 0.24 } },
  { customer: 'CSS', name: 'CIEDB-EOL対応', rank: 'A', months: { 10: 7.30, 11: 7.30, 12: 7.30, 1: 7.30, 2: 7.30, 3: 7.30, 4: 7.30, 5: 7.30, 6: 7.30, 7: 7.30, 8: 7.30, 9: 7.30 } },
  { customer: '千里堂', name: 'カルテシステム運用・保守費用', rank: 'A', months: { 10: 0.05, 11: 0.05, 12: 0.05, 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.05, 6: 0.25, 7: 0.05, 8: 0.05, 9: 0.05 } },
  { customer: 'INI', name: 'JAFナビサイト通常保守', rank: 'A', months: { 10: 0.16, 11: 0.16, 12: 0.16, 1: 0.16, 2: 0.16, 3: 0.16, 4: 0.16, 5: 0.16, 6: 0.16, 7: 0.16, 8: 0.16, 9: 0.16 } },
  { customer: 'INI', name: 'スポット', rank: 'C', months: { 10: 0.18, 4: 1.76, 6: 0.72 } },
  { customer: 'DPS', name: '保守', rank: 'A', months: { 10: 0.01, 11: 0.01, 12: 0.01, 1: 0.01, 2: 0.01, 3: 0.01, 4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01 } },
  { customer: 'DPS', name: 'スポット', rank: 'C', months: { 12: 0.27 } },
  { customer: 'まきの', name: 'システム保守', rank: 'A', months: { 10: 0.09, 11: 0.09, 12: 0.09, 1: 0.09, 2: 0.09, 3: 0.09, 4: 0.09, 5: 0.09, 6: 0.09, 7: 0.09, 8: 0.09, 9: 0.09 } },
  { customer: 'まきの', name: 'スポット', rank: 'C', months: { 11: 0.33, 1: 0.15, 2: 0.27, 4: 0.66, 7: 2.33, 9: 0.18 } },
  { customer: 'HCC', name: 'システム保守', rank: 'A', months: { 10: 0.06, 11: 0.06, 12: 0.06, 1: 0.06, 2: 0.06, 3: 0.06, 4: 0.06, 5: 0.06, 6: 0.06, 7: 0.06, 8: 0.06, 9: 0.06 } },
  { customer: '王子ゴム', name: '業績のぼるくん運用・保守費用', rank: 'C', months: { 1: 0.36 } },
  { customer: '川六', name: 'システム保守', rank: 'A', months: { 12: 0.36, 6: 0.21 } },
  { customer: '川六', name: 'スポット', rank: 'C', months: { 6: 0.85, 8: 5.40 } },
  { customer: 'ひたち農園', name: 'チャットワークAPI運用・保守費用', rank: 'C', months: { 2: 0.06 } },
  { customer: 'グランド商事', name: 'サーバ利用料', rank: 'A', months: { 10: 0.03, 11: 0.03, 12: 0.03, 1: 0.03, 2: 0.03, 3: 0.03, 4: 0.03, 5: 0.03, 6: 0.03, 7: 0.03, 8: 0.03, 9: 0.03 } },
  { customer: 'ケミトックス', name: 'システム保守、サーバ利用料', rank: 'C', months: { 6: 0.42 } },
  { customer: '秀永', name: '支払い代行', rank: 'C', months: { 1: 0.09 } },
  { customer: 'コンテナ事業', name: 'コンテナ利用料', rank: 'B', months: { 10: 0.10, 11: 0.10, 12: 0.10, 1: 0.10, 2: 0.10, 3: 0.10, 4: 0.10, 5: 0.10, 6: 0.10, 7: 0.10, 8: 0.10, 9: 0.10 } },
  { customer: 'その他', name: 'MG', rank: 'B', months: { 10: 0.38, 12: 0.24, 1: 0.28, 2: 0.24, 3: 0.30, 4: 0.09, 5: 0.60, 6: 0.61, 8: 0.15, 9: 0.06 } },
  { customer: 'その他', name: 'MRAG販売', rank: 'B', months: { 2: 1.00 } },
  { customer: 'その他', name: 'webrootライセンス更新', rank: 'B', months: { 8: 0.84 } },
  { customer: 'その他', name: 'BPマッチング', rank: 'B', months: { 10: 1.76, 11: 1.75, 12: 1.67, 1: 1.83, 2: 2.05, 3: 1.94, 4: 1.31, 5: 1.42, 6: 1.77, 7: 1.73, 8: 1.69, 9: 1.60 } },
];

const getDeliveryMonth = (monthNum) => {
  if (monthNum >= 10) {
    return `2026-${monthNum}`;
  } else {
    return `2027-0${monthNum}`;
  }
};

try {
  console.log('月別×顧客別データを案件ごとのレコードに変換して追加中...');

  const insertStmt = db.prepare(`
    INSERT INTO orders
    (id, name, customer, amount, deliveryMonth, rank, status, created_by, created_at, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const now = new Date().toISOString();

  data.forEach(item => {
    Object.entries(item.months).forEach(([month, amount]) => {
      const id = `forecast-${item.customer}-${item.name}-${month}`;
      const deliveryMonth = getDeliveryMonth(parseInt(month));
      const preciseAmount = Math.round(amount * 100) / 100; // 小数点精度修正

      insertStmt.run(
        id,
        item.name,
        item.customer,
        preciseAmount,
        deliveryMonth,
        item.rank,
        '進行中',
        '武　勇樹',
        now,
        '武　勇樹',
        now
      );
      count++;
    });
  });

  console.log(`✓ ${count}件のレコードを追加しました`);

  // 合計確認
  const result = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  console.log(`\nデータベース総レコード数: ${result.count}件`);

  // 月別合計確認
  console.log('\n月別合計確認:');
  const months = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09'];
  let total = 0;
  months.forEach(month => {
    const monthResult = db.prepare('SELECT SUM(amount) as total FROM orders WHERE deliveryMonth = ?').get(month);
    const monthTotal = (monthResult.total || 0);
    total += monthTotal;
    console.log(`${month}: ${(monthTotal).toFixed(2)}万円`);
  });
  console.log(`合計: ${total.toFixed(2)}万円`);

} catch (error) {
  console.error('エラー:', error.message);
} finally {
  db.close();
}
