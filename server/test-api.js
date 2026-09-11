const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/orders',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const orders = JSON.parse(data);
      const orders2026 = orders.filter(o => o.deliveryMonth >= '2026-10' && o.deliveryMonth <= '2027-09');

      console.log(`API から取得したレコード数: ${orders.length}`);
      console.log(`2026-10～2027-09 のレコード数: ${orders2026.length}`);
      console.log('\nサンプル（最初の10件）:');

      orders2026.slice(0, 10).forEach(o => {
        console.log(`  ${o.customer} - ${o.name}: ${o.amount}万円 (${o.deliveryMonth})`);
      });

      // 顧客ごとの集計
      console.log('\n顧客ごとの合計:');
      const grouped = {};
      orders2026.forEach(o => {
        if (!grouped[o.customer]) grouped[o.customer] = 0;
        grouped[o.customer] += o.amount;
      });
      Object.entries(grouped).sort().forEach(([cust, total]) => {
        console.log(`  ${cust}: ${total.toFixed(1)}万円`);
      });

    } catch (e) {
      console.error('解析エラー:', e.message);
      console.log('データ:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`APIエラー: ${e.message}`);
  process.exit(1);
});

req.end();
