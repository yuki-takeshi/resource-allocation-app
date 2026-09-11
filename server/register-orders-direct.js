const Database = require('better-sqlite3');
const db = new Database('./orders.db');

// Googleシートのデータから受注残管理用のレコードを作成
const data = [
  // 武蔵野
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2026-10', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2026-11', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2026-12', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-01', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-02', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-03', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-04', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-05', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-06', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-07', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-08', amount: 1.31 },
  { customer: '武蔵野', name: '武蔵野 DX', deliveryMonth: '2027-09', amount: 1.31 },

  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2026-10', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2026-11', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2026-12', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-01', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-02', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-03', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-04', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-05', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-06', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-07', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-08', amount: 0.76 },
  { customer: '武蔵野', name: '武蔵野 システム部', deliveryMonth: '2027-09', amount: 0.76 },

  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2026-10', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2026-11', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2026-12', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-01', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-02', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-03', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-04', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-05', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-06', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-07', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-08', amount: 1.54 },
  { customer: '武蔵野', name: '武蔵野 マイページ', deliveryMonth: '2027-09', amount: 1.54 },

  // CSS
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2026-10', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2026-11', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2026-12', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-01', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-02', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-03', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-04', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-05', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-06', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-07', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-08', amount: 7.30 },
  { customer: 'CSS', name: 'CSS CIEDB-EOL対応', deliveryMonth: '2027-09', amount: 7.30 },

  // BPマッチング（その他）
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2026-10', amount: 1.76 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2026-11', amount: 1.75 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2026-12', amount: 1.67 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-01', amount: 1.83 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-02', amount: 2.05 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-03', amount: 1.94 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-04', amount: 1.31 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-05', amount: 1.42 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-06', amount: 1.77 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-07', amount: 1.73 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-08', amount: 1.69 },
  { customer: 'その他', name: 'BPマッチング', deliveryMonth: '2027-09', amount: 1.60 },
];

try {
  console.log('2026-10～2027-09 のレコードを削除中...');
  db.prepare('DELETE FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ?').run('2026-10', '2027-09');
  console.log('削除完了');

  console.log('\n受注残管理用のレコードを登録中...');

  const insertStmt = db.prepare(`
    INSERT INTO orders
    (id, name, customer, amount, deliveryMonth, rank, status, created_by, created_at, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const now = new Date().toISOString();

  data.forEach((item, index) => {
    const id = `order-${item.customer}-${item.name}-${item.deliveryMonth}-${index}`;
    const preciseAmount = Math.round(item.amount * 100) / 100;

    insertStmt.run(
      id,
      item.name,
      item.customer,
      preciseAmount,
      item.deliveryMonth,
      'A',  // ランクは統一してA
      '進行中',
      '武　勇樹',
      now,
      '武　勇樹',
      now
    );
    count++;
  });

  console.log(`✓ ${count}件のレコードを登録しました`);

  // 合計確認
  const result = db.prepare('SELECT COUNT(*) as count FROM orders WHERE deliveryMonth >= ? AND deliveryMonth <= ?').get('2026-10', '2027-09');
  console.log(`\n2026-10～2027-09 のレコード数: ${result.count}件`);

} catch (error) {
  console.error('エラー:', error.message);
} finally {
  db.close();
}
