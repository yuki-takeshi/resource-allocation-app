import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function CustomerMonthlyDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState(() => {
    // ローカルストレージから期間設定を復元
    const saved = localStorage.getItem('selectedYear');
    return saved || '2026-2027'; // デフォルト: 2026年10月
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [draggedRow, setDraggedRow] = useState(null);
  const [customerOrder, setCustomerOrder] = useState([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrintSections, setSelectedPrintSections] = useState({
    table: true,
    quarterly: true,
  });

  // 月のリスト（10月～9月）- selectedYear に基づいて動的に生成
  const getMonths = () => {
    if (selectedYear === '2026-2027') {
      return [
        { value: '2026-10', label: '10月' },
        { value: '2026-11', label: '11月' },
        { value: '2026-12', label: '12月' },
        { value: '2027-01', label: '1月' },
        { value: '2027-02', label: '2月' },
        { value: '2027-03', label: '3月' },
        { value: '2027-04', label: '4月' },
        { value: '2027-05', label: '5月' },
        { value: '2027-06', label: '6月' },
        { value: '2027-07', label: '7月' },
        { value: '2027-08', label: '8月' },
        { value: '2027-09', label: '9月' },
      ];
    }
    // デフォルト: 2025-10～2026-09
    return [
      { value: '2025-10', label: '10月' },
      { value: '2025-11', label: '11月' },
      { value: '2025-12', label: '12月' },
      { value: '2026-01', label: '1月' },
      { value: '2026-02', label: '2月' },
      { value: '2026-03', label: '3月' },
      { value: '2026-04', label: '4月' },
      { value: '2026-05', label: '5月' },
      { value: '2026-06', label: '6月' },
      { value: '2026-07', label: '7月' },
      { value: '2026-08', label: '8月' },
      { value: '2026-09', label: '9月' },
    ];
  };

  const months = getMonths();

  // 期間に応じた金額表示（単位変換）
  const displayAmount = (amount) => {
    // 2025-10～2026-09 は円単位、2026-10～2027-09 は万円単位
    if (selectedYear === '2025-2026') {
      // 円単位 → 万円単位に変換
      return (amount / 10000).toFixed(1);
    } else {
      // 2026-10～2027-09 は既に万円単位で保存されている
      return amount.toFixed(1);
    }
  };

  // 年度に基づいてフィルタリングされたデータを取得
  const getFilteredOrders = () => {
    const monthList = getMonths();
    const monthSet = new Set(monthList.map(m => m.value));
    return orders.filter(o => monthSet.has(o.deliveryMonth));
  };

  // 期間設定をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
  }, [selectedYear]);


  // データ取得
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('受注データ取得エラー:', error);
      }
    };
    fetchOrders();
  }, []);

  // 顧客ごとにデータを集計（年度フィルター適用済み）
  const getCustomerData = () => {
    const customerMap = {};
    const filteredOrders = getFilteredOrders();

    filteredOrders.forEach(order => {
      if (!customerMap[order.customer]) {
        customerMap[order.customer] = {};
      }

      // 月ごとに案件を集約
      if (!customerMap[order.customer][order.deliveryMonth]) {
        customerMap[order.customer][order.deliveryMonth] = [];
      }

      customerMap[order.customer][order.deliveryMonth].push(order);
    });

    return customerMap;
  };

  // 顧客リストを取得（年度フィルター適用済み）
  // 削除トリガー：全ての案件が失注ステータスの顧客はダッシュボードから削除
  const getUniqueCustomers = () => {
    const filteredOrders = getFilteredOrders();
    // 追加順序を保持するため、ソートしない
    const uniqueCustomers = [];
    const customerSet = new Set();

    for (const order of filteredOrders) {
      if (order.customer && !customerSet.has(order.customer)) {
        // その顧客の全ての案件を取得
        const customerAllOrders = filteredOrders.filter(o => o.customer === order.customer);

        // その顧客に失注以外の案件が1件でもあれば表示
        const hasNonLostOrder = customerAllOrders.some(o => o.status !== '失注');

        if (hasNonLostOrder) {
          customerSet.add(order.customer);
          uniqueCustomers.push(order.customer);
        }
      }
    }
    return uniqueCustomers;
  };

  // カスタマーオーダーの初期化（期間切り替え時にリセット）
  useEffect(() => {
    const uniqueCustomers = getUniqueCustomers();
    const NEW_CUSTOMERS_EXCLUDE = ['東京芝浦臓器', 'ニヤクシステム', '和光', '二天記'];

    if (uniqueCustomers.length > 0) {
      // ユーザーがドラッグで並び替えた最新の順序（2026-09-09確定）
      const fixedOrder = [
        '武蔵野', 'CSS', 'INI', '千里堂', 'PBR', 'まきの', '光マーク', '川六', 'HCC',
        'マークシティー', 'ケミトックス', '王子ゴム', 'グランド商事', 'DPS', '秀永',
        'ひたち農園', 'コンテナ事業', 'CTC', '新規現場', 'ニヤクシステム',
        '東京芝浦臓器', '二天紀', '和光'
      ];

      setCustomerOrder(fixedOrder);
    } else {
      setCustomerOrder([]);
    }
    // 期間切り替え時に状態をリセット
    setSelectedRow(null);
    setSelectedCell(null);
    setDraggedRow(null);
    setEditMode(false);
    setEditingOrder(null);
  }, [selectedYear]);


  // 営業部分類と固定項目
  const SALES_CATEGORIES = ['BPマッチング', 'MRAG'];
  const LOCKED_CUSTOMERS = ['白地'];

  // 表示用顧客リスト（並び替え後、営業部分類と固定項目を除外）
  const getDisplayCustomers = () => {
    const uniqueCustomers = getUniqueCustomers();
    const regularCustomers = uniqueCustomers.filter(c => !SALES_CATEGORIES.includes(c) && !LOCKED_CUSTOMERS.includes(c));

    if (customerOrder.length > 0) {
      // customerOrder に含まれる顧客（ドラッグで変更した順序を保持）
      const orderedCustomers = customerOrder.filter(c => regularCustomers.includes(c));

      // customerOrder に含まれない顧客（新規顧客）- 追加順序を保持
      const newCustomers = regularCustomers.filter(c => !customerOrder.includes(c));

      return orderedCustomers.concat(newCustomers);
    }
    return regularCustomers.sort();
  };

  // 固定項目を取得
  const getLockedCustomers = () => {
    const filteredOrders = getFilteredOrders();
    const lockedSet = new Set(
      filteredOrders
        .filter(o => LOCKED_CUSTOMERS.includes(o.customer))
        .map(o => o.customer)
    );
    return LOCKED_CUSTOMERS.filter(cat => lockedSet.has(cat));
  };

  // 営業部分類を取得
  const getSalesCategories = () => {
    const filteredOrders = getFilteredOrders();
    const categoriesSet = new Set(
      filteredOrders
        .filter(o => SALES_CATEGORIES.includes(o.customer))
        .map(o => o.customer)
    );
    return SALES_CATEGORIES.filter(cat => categoriesSet.has(cat));
  };

  // 特定の顧客・月の合計金額を計算
  const getTotalAmount = (customer, month, includeNG = true) => {
    const customerData = getCustomerData();
    const monthOrders = customerData[customer]?.[month] || [];

    return monthOrders
      .filter(o => {
        if (!includeNG && o.status === '失注') return false;
        if (!includeNG && !['A', 'B'].includes(o.rank)) return false;
        return true;
      })
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  };

  // 月別の合計を計算
  const getMonthTotal = (month, rankFilter = null) => {
    const filteredOrders = getFilteredOrders();
    return filteredOrders
      .filter(o => {
        if (o.deliveryMonth !== month) return false;
        if (o.status === '失注') return false;
        if (rankFilter && !['A', 'B'].includes(o.rank)) return false;
        return true;
      })
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  };

  // セルクリック時のドリルダウン
  const handleCellClick = (customer, month) => {
    const customerData = getCustomerData();
    const monthOrders = customerData[customer]?.[month] || [];
    setSelectedCell({ customer, month, orders: monthOrders });
    setSelectedRow(customer);
  };

  // ドラッグ開始
  const handleDragStart = (e, customer) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('draggedCustomer', customer);
    setDraggedRow(customer);
  };

  // ドラッグオーバー
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ドロップ
  const handleDrop = (e, targetCustomer) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const draggedCustomer = e.dataTransfer.getData('draggedCustomer');

      if (!draggedCustomer || draggedCustomer === targetCustomer) {
        setDraggedRow(null);
        return;
      }

      // ドラッグされた顧客が customerOrder に含まれない場合は追加
      const uniqueCustomers = getUniqueCustomers();
      const regularCustomers = uniqueCustomers.filter(c => !SALES_CATEGORIES.includes(c)); // 白地を含める

      let currentOrder = customerOrder.length > 0 ? [...customerOrder] : regularCustomers;

      if (!currentOrder.includes(draggedCustomer) && regularCustomers.includes(draggedCustomer)) {
        currentOrder.push(draggedCustomer);
      }

      const newOrder = [...currentOrder];
      const draggedIndex = newOrder.indexOf(draggedCustomer);
      const targetIndex = newOrder.indexOf(targetCustomer);

      console.log(`ドロップ: "${draggedCustomer}" → "${targetCustomer}"`, {
        draggedIndex,
        targetIndex,
        draggedCustomer,
        targetCustomer,
        newOrder
      });

      if (draggedIndex === -1 || targetIndex === -1) {
        console.error('インデックスが見つかりません', {
          draggedIndex,
          targetIndex,
          draggedCustomer,
          newOrder
        });
        setDraggedRow(null);
        return;
      }

      // 入れ替え
      const temp = newOrder[draggedIndex];
      newOrder[draggedIndex] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      console.log('新しい順序:', newOrder);
      setCustomerOrder(newOrder);
      setDraggedRow(null);
    } catch (error) {
      console.error('ドロップエラー:', error);
      setDraggedRow(null);
    }
  };

  // 監査ログを取得
  const handleShowAudit = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/audit-log`);
      const logs = await response.json();
      setAuditLogs(logs);
      setShowAuditModal(true);
    } catch (error) {
      console.error('監査ログ取得エラー:', error);
    }
  };

  // 白地の下に新規顧客を配置
  const customers = (() => {
    const displayCustomers = getDisplayCustomers(); // 既存顧客（白地を除く）
    return displayCustomers; // 白地は別途 getLockedCustomers() でレンダリング
  })();

  // 印刷処理
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>月別×顧客別ダッシュボード</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Arial', 'MS Gothic', sans-serif;
            color: #333;
            background: white;
            padding: 10mm;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #003d82;
            padding-bottom: 10px;
          }
          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #003d82;
          }
          .print-date {
            font-size: 14px;
            font-weight: bold;
            color: #666;
          }
          .period-info {
            font-size: 13px;
            margin-bottom: 15px;
            color: #555;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
          }
          th {
            background-color: #003d82;
            color: white;
            font-weight: bold;
            border: 1px solid #333;
            padding: 10px 5px;
            font-size: 13px;
            text-align: center;
          }
          td {
            border: 1px solid #999;
            padding: 8px 5px;
            text-align: center;
            font-size: 12px;
            height: 60px;
            vertical-align: middle;
          }
          .customer-cell {
            text-align: left;
            font-weight: bold;
            background-color: #f5f5f5;
            width: 80px;
          }
          .amount-cell {
            font-size: 16px;
            font-weight: bold;
            color: #003d82;
          }
          .target-cell {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
          }
          .diff-cell {
            font-size: 12px;
            font-weight: bold;
            margin-top: 3px;
          }
          .diff-positive {
            color: #0066cc;
          }
          .diff-negative {
            color: #cc0000;
            background-color: #ffe6e6;
          }
          .summary-row {
            background-color: #ffd966;
            font-weight: bold;
          }
          .summary-row td {
            background-color: #ffd966;
            font-weight: bold;
          }
          .loss-row {
            background-color: #e7e6e6;
            color: #999;
          }
          .total-cell {
            background-color: #e6f2ff;
            font-weight: bold;
          }
          /* 四半期集計テーブルスタイル */
          .quarterly-summary h2 {
            background-color: #ea580c !important;
            color: white !important;
            padding: 15px !important;
            margin: 30px 0 0 0 !important;
            font-size: 18px !important;
          }
          .quarterly-summary table {
            margin-top: 10px;
            background: white;
          }
          .quarterly-summary th {
            background-color: #d84315 !important;
            color: white !important;
            font-weight: bold;
            padding: 12px 8px;
            font-size: 13px;
            text-align: center;
            border: 1px solid #333;
          }
          .quarterly-summary td {
            padding: 12px 8px;
            font-size: 12px;
            border: 1px solid #999;
            text-align: center;
            height: auto;
          }
          /* 第1Q - 赤系 */
          .quarterly-summary tbody tr:nth-child(1) {
            background-color: #ffebee !important;
          }
          .quarterly-summary tbody tr:nth-child(1) td:first-child {
            background-color: #d32f2f !important;
            color: white !important;
            font-weight: bold;
          }
          /* 第2Q - 黄系 */
          .quarterly-summary tbody tr:nth-child(2) {
            background-color: #fffde7 !important;
          }
          .quarterly-summary tbody tr:nth-child(2) td:first-child {
            background-color: #f57f17 !important;
            color: white !important;
            font-weight: bold;
          }
          /* 第3Q - 緑系 */
          .quarterly-summary tbody tr:nth-child(3) {
            background-color: #e8f5e9 !important;
          }
          .quarterly-summary tbody tr:nth-child(3) td:first-child {
            background-color: #388e3c !important;
            color: white !important;
            font-weight: bold;
          }
          /* 第4Q - 青系 */
          .quarterly-summary tbody tr:nth-child(4) {
            background-color: #e3f2fd !important;
          }
          .quarterly-summary tbody tr:nth-child(4) td:first-child {
            background-color: #1976d2 !important;
            color: white !important;
            font-weight: bold;
          }
          /* 実績と目標 */
          .quarterly-summary td:nth-child(2) {
            font-weight: bold;
            font-size: 14px;
            color: #2e7d32;
          }
          .quarterly-summary td:nth-child(3) {
            font-weight: bold;
            font-size: 14px;
            color: #333;
          }
          /* 差分（プラスマイナス）*/
          .quarterly-summary td:nth-child(4) {
            font-weight: bold;
            font-size: 14px;
          }
          .quarterly-summary tbody tr:nth-child(1) td:nth-child(4),
          .quarterly-summary tbody tr:nth-child(2) td:nth-child(4),
          .quarterly-summary tbody tr:nth-child(3) td:nth-child(4),
          .quarterly-summary tbody tr:nth-child(4) td:nth-child(4) {
            font-weight: bold;
            font-size: 15px;
          }
          /* プラスは青、マイナスは赤 */
          .quarterly-summary tbody tr td:nth-child(4) {
            position: relative;
          }

          @media print {
            body { margin: 0; padding: 10mm; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>月別×顧客別ダッシュボード</h1>
          <div class="print-date">${dateStr}</div>
        </div>
        <div class="period-info">会計年度: <strong>${selectedYear === '2025-2026' ? '2025-10～2026-09' : '2026-10～2027-09'}</strong></div>
        <div id="content"></div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);

    // テーブルHTMLを動的に生成
    const contentDiv = printWindow.document.getElementById('content');

    // ダッシュボードテーブルを追加
    if (selectedPrintSections.table) {
      const tableElement = document.querySelector('.dashboard-table');
      if (tableElement) {
        // テーブルをコピーして、スタイルを調整
        const table = tableElement.cloneNode(true);

        // 各セルのクラスを追加
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, cellIndex) => {
            if (cellIndex === 0) {
              cell.classList.add('customer-cell');
            } else if (cellIndex < cells.length - 1) {
              // 金額セルの装飾
              const text = cell.textContent;
              if (text && !text.includes('✕')) {
                cell.style.padding = '5px';
                cell.style.height = '60px';
                // 複数行テキストの場合、スタイルを分ける
                const parts = cell.innerHTML.split('<div');
                if (parts.length > 1) {
                  cell.innerHTML = cell.innerHTML
                    .replace(/(<div[^>]*>)([^<]*)(万)(<\/div>)/g,
                      '<div style="font-size: 16px; font-weight: bold; color: #003d82;">$2$3</div>')
                    .replace(/\/([\d.]+)万/g,
                      '<div class="target-cell">/$1万</div>')
                    .replace(/([+-])([\d.]+)万/g,
                      '<div class="diff-cell $1" style="color: ' + (cell.textContent.includes('-') ? '#cc0000; background: #ffe6e6;' : '#0066cc;') + '">$1$2万</div>');
                }
              }
            }
          });
        });

        contentDiv.appendChild(table);
      }
    }

    // 四半期集計テーブルを追加
    if (selectedPrintSections.quarterly) {
      const quarterlyElement = document.querySelector('.quarterly-summary');
      if (quarterlyElement) {
        // 四半期セクションを作成
        const quarterlyDiv = document.createElement('div');
        quarterlyDiv.style.marginTop = '30px';
        quarterlyDiv.style.pageBreakBefore = 'always';

        // 見出しを追加
        const heading = document.createElement('h2');
        heading.textContent = '📊 四半期集計';
        heading.style.fontSize = '18px';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '15px';
        heading.style.color = 'white';
        heading.style.backgroundColor = '#ea580c';
        heading.style.padding = '12px';

        // テーブルをコピー
        const quarterlyTable = quarterlyElement.cloneNode(true);
        quarterlyTable.style.marginTop = '10px';

        // 差分セルに色を付ける
        const rows = quarterlyTable.querySelectorAll('tbody tr');
        rows.forEach((row, idx) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const diffCell = cells[3]; // 差分セルは4番目
            const diffText = diffCell.textContent.trim();

            // プラスマイナスの判定
            if (diffText.startsWith('+')) {
              diffCell.style.color = '#0066cc';
              diffCell.style.fontWeight = 'bold';
              diffCell.style.fontSize = '14px';
            } else if (diffText.startsWith('-')) {
              diffCell.style.color = '#cc0000';
              diffCell.style.fontWeight = 'bold';
              diffCell.style.fontSize = '14px';
            }
          }
        });

        quarterlyDiv.appendChild(heading);
        quarterlyDiv.appendChild(quarterlyTable);
        contentDiv.appendChild(quarterlyDiv);
      }
    }

    printWindow.document.close();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">月別×顧客別ダッシュボード</h1>
          <button
            onClick={() => setShowPrintDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            🖨️ 印刷
          </button>
        </div>

        {/* 会計年度選択 */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setSelectedYear('2025-2026')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              selectedYear === '2025-2026'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            2025-10～2026-09
          </button>
          <button
            onClick={() => setSelectedYear('2026-2027')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              selectedYear === '2026-2027'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            2026-10～2027-09
          </button>
        </div>

        {/* ピボットテーブル */}
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto dashboard-table">
          <table key={selectedYear} className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="px-4 py-3 text-center font-bold border w-12">No.</th>
                <th className="px-4 py-3 text-left font-bold border">顧客名</th>
                {months.map(month => (
                  <th key={month.value} className="px-4 py-3 text-center font-bold border text-sm">
                    {month.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-bold border">合計</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => {
                const filteredOrders = getFilteredOrders();
                const isLossCustomer = filteredOrders
                  .filter(o => o.customer === customer)
                  .every(o => o.status === '失注');

                const isRowSelected = selectedRow === customer;
                const isRowDragged = draggedRow === customer;

                // ドラッグ可能かどうか：営業部分類（BPマッチング、MRAG）のみドラッグ不可
                // 白地と新規顧客はドラッグ可能
                const isDraggable = true; // 白地含むすべての顧客がドラッグ可能

                return (
                  <tr
                    key={`${selectedYear}-${customer}`}
                    draggable={isDraggable}
                    onDragStart={(e) => {
                      if (isDraggable) handleDragStart(e, customer);
                    }}
                    onDragOver={(e) => {
                      if (isDraggable) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDragLeave={(e) => {
                      if (isDraggable) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isDraggable) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(e, customer);
                      }
                    }}
                    onDragEnd={(e) => {
                      if (isDraggable) {
                        e.preventDefault();
                        setDraggedRow(null);
                      }
                    }}
                    className={`border-b transition ${
                      isRowDragged ? 'opacity-50 bg-blue-200' : ''
                    } ${
                      isRowSelected ? 'bg-blue-100' : isLossCustomer ? 'bg-gray-100' : ''
                    } ${isDraggable && !isRowDragged ? 'cursor-grab hover:cursor-grab' : isDraggable && isRowDragged ? 'cursor-grabbing' : 'cursor-default'}`}
                  >
                    <td className="px-4 py-3 text-center font-medium border text-gray-700 bg-gray-50 w-12">
                      {index + 1}
                    </td>
                    <td
                      onClick={() => setSelectedRow(customer)}
                      className={`px-4 py-3 font-medium border ${
                        isRowSelected ? 'bg-blue-200 font-bold' : ''
                      } ${isLossCustomer ? 'text-gray-500' : ''}`}
                    >
                      {isLossCustomer && '✕'}
                      {customer}
                    </td>
                    {months.map(month => {
                      const customerData = getCustomerData();
                      const monthOrders = customerData[customer]?.[month.value] || [];
                      const amount = getTotalAmount(customer, month.value);
                      const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                      const difference = amount - targetAmount;
                      const isLoss = monthOrders.every(o => o.status === '失注');
                      const isCellSelected = selectedCell?.customer === customer && selectedCell?.month === month.value;

                      return (
                        <td
                          key={month.value}
                          onClick={() => customer !== '白地' && handleCellClick(customer, month.value)}
                          className={`px-4 py-3 text-center border ${customer !== '白地' ? 'cursor-pointer' : 'cursor-default'} transition ${
                            customer !== '白地' ? (isCellSelected ? 'bg-blue-300' : isRowSelected ? 'bg-blue-100' : 'hover:bg-blue-50') : ''
                          } ${isLoss && customer !== '白地' ? 'bg-gray-200 text-gray-500' : ''}`}
                        >
                          {customer === '白地' ? (
                            <div className="text-lg font-bold text-gray-900">
                              {targetAmount > 0 ? Math.round(displayAmount(targetAmount)) + '万' : '-'}
                            </div>
                          ) : (
                            amount > 0 || targetAmount > 0 ? (
                              <div className="py-1">
                                <div className="text-lg font-bold text-gray-900">{displayAmount(amount)}万</div>
                                <div className="text-xs text-gray-600 leading-tight">
                                  /{displayAmount(targetAmount)}万
                                </div>
                                <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                                </div>
                              </div>
                            ) : (
                              '-'
                            )
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 text-center font-bold border ${
                      isRowSelected ? 'bg-blue-200' : ''
                    } ${isLossCustomer ? 'text-gray-500' : ''}`}>
                      {(() => {
                        const total = filteredOrders.filter(o => o.customer === customer && o.status !== '失注');
                        const amount = total.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = total.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;
                        return (
                          <div className="py-1">
                            <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                            <div className="text-xs text-gray-600 leading-tight">
                              /{displayAmount(targetAmount)}万
                            </div>
                            <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}

              {/* 既存ビジネス計行 - 通常顧客 + 新規現場（営業部と白地を除外） */}
              <tr className="bg-yellow-100 font-bold">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-yellow-200">既存ビジネス計</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  const excludedCustomers = ['白地', 'BPマッチング', 'MRAG'];
                  return (
                    <>
                      {months.map(month => {
                        const monthOrders = filteredOrders.filter(o =>
                          o.deliveryMonth === month.value &&
                          o.status !== '失注' &&
                          !excludedCustomers.includes(o.customer)
                        );
                        const amount = monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900 bg-yellow-100">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-yellow-200">
                        {(() => {
                          const total = filteredOrders.filter(o =>
                            o.status !== '失注' &&
                            !excludedCustomers.includes(o.customer)
                          );
                          const amount = total.reduce((sum, o) => sum + (o.amount || 0), 0);
                          const targetAmount = total.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                          const difference = amount - targetAmount;

                          return (
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 白地行 */}
              {getLockedCustomers().map(customer => {
                const isRowSelected = selectedRow === customer;
                const isRowDragged = draggedRow === customer;
                return (
                  <tr
                    key={customer}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', customer);
                      setDraggedRow(customer);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop(e, customer);
                    }}
                    onDragEnd={(e) => {
                      e.preventDefault();
                      setDraggedRow(null);
                    }}
                    className={`bg-gray-100 font-bold transition ${
                      isRowDragged ? 'opacity-50 bg-blue-200' : ''
                    } ${isRowSelected ? 'bg-blue-100' : ''} cursor-grab hover:cursor-grab`}
                  >
                    <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                    <td
                      onClick={() => setSelectedRow(customer)}
                      className={`px-4 py-3 font-medium border ${
                        isRowSelected ? 'bg-blue-200 font-bold' : ''
                      }`}
                    >
                      {customer}
                    </td>
                    {months.map(month => {
                      const customerData = getCustomerData();
                      const monthOrders = customerData[customer]?.[month.value] || [];
                      const amount = getTotalAmount(customer, month.value);
                      const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                      const difference = amount - targetAmount;
                      const isCellSelected = selectedCell?.customer === customer && selectedCell?.month === month.value;

                      return (
                        <td
                          key={month.value}
                          onClick={() => handleCellClick(customer, month.value)}
                          className={`px-4 py-3 text-center border cursor-pointer transition ${
                            isCellSelected ? 'bg-gray-400 font-bold' : isRowSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-lg font-bold text-gray-900">
                            {targetAmount > 0 ? Math.round(displayAmount(targetAmount)) + '万' : '-'}
                          </div>
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 text-center font-bold border ${
                      isRowSelected ? 'bg-gray-300' : 'bg-gray-200'
                    }`}>
                      {Math.round(displayAmount(getFilteredOrders()
                        .filter(o => o.customer === customer && o.status !== '失注')
                        .reduce((sum, o) => sum + (o.targetAmount || 0), 0)))}万
                    </td>
                  </tr>
                );
              })}

              {/* 開発事業部目標合計行 - 既存ビジネス計 + 白地 + 新規現場 */}
              <tr className="bg-purple-100 font-bold">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-purple-200">開発事業部目標合計</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  const salesCategories = ['BPマッチング', 'MRAG'];
                  return (
                    <>
                      {months.map(month => {
                        const monthOrders = filteredOrders.filter(o =>
                          o.deliveryMonth === month.value &&
                          o.status !== '失注' &&
                          !salesCategories.includes(o.customer)
                        );
                        const amount = monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900 bg-purple-100">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-purple-200">
                        {(() => {
                          const total = filteredOrders.filter(o =>
                            o.status !== '失注' &&
                            !salesCategories.includes(o.customer)
                          );
                          const amount = total.reduce((sum, o) => sum + (o.amount || 0), 0);
                          const targetAmount = total.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                          const difference = amount - targetAmount;

                          return (
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 営業部分類行 - BPマッチング、MRAG */}
              {getSalesCategories().map(category => {
                const isRowSelected = selectedRow === category;
                return (
                  <tr key={category} className="bg-orange-50 font-bold border-t-2 border-orange-300">
                    <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                    <td
                      onClick={() => setSelectedRow(category)}
                      className={`px-4 py-3 font-medium border cursor-default ${
                        isRowSelected ? 'bg-orange-200 font-bold' : 'bg-orange-100'
                      }`}
                    >
                      {category}
                    </td>
                    {months.map(month => {
                      const customerData = getCustomerData();
                      const monthOrders = customerData[category]?.[month.value] || [];
                      const amount = getTotalAmount(category, month.value);
                      const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                      const difference = amount - targetAmount;
                      const isCellSelected = selectedCell?.customer === category && selectedCell?.month === month.value;

                      return (
                        <td
                          key={month.value}
                          onClick={() => handleCellClick(category, month.value)}
                          className={`px-4 py-3 text-center border cursor-pointer transition ${
                            isCellSelected ? 'bg-orange-400' : isRowSelected ? 'bg-orange-100' : 'hover:bg-orange-50'
                          }`}
                        >
                          <div className="py-1">
                            <div className="text-lg font-bold text-gray-900">{displayAmount(amount)}万</div>
                            <div className="text-xs text-gray-600 leading-tight">
                              /{displayAmount(targetAmount)}万
                            </div>
                            <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 text-center font-bold border ${
                      isRowSelected ? 'bg-orange-200' : 'bg-orange-100'
                    }`}>
                      {(() => {
                        const categoryOrders = getFilteredOrders()
                          .filter(o => o.customer === category && o.status !== '失注');
                        const amount = categoryOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = categoryOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;

                        return (
                          <div className="py-1">
                            <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                            <div className="text-xs text-gray-600 leading-tight">
                              /{displayAmount(targetAmount)}万
                            </div>
                            <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}

              {/* 営業部合計目標行 */}
              <tr className="bg-green-100 font-bold">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-green-200">営業部合計目標</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  const eigyouData = [215.0, 191.0, 201.0, 273.0, 223.0, 233.0, 277.0, 219.0, 230.0, 240.0, 249.0, 249.0];
                  return (
                    <>
                      {months.map((month, idx) => {
                        const bpMragOrders = filteredOrders.filter(o =>
                          o.deliveryMonth === month.value &&
                          ['BPマッチング', 'MRAG'].includes(o.customer)
                        );
                        const actualAmount = bpMragOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const difference = actualAmount - eigyouData[idx];

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900 bg-green-100">
                            <div className="py-1">
                              <div className="text-lg font-bold">{eigyouData[idx].toFixed(1)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{eigyouData[idx].toFixed(1)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{difference.toFixed(1)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-green-200">
                        {(() => {
                          const bpMragTotal = filteredOrders.filter(o =>
                            ['BPマッチング', 'MRAG'].includes(o.customer)
                          );
                          const actualTotal = bpMragTotal.reduce((sum, o) => sum + (o.amount || 0), 0);
                          const targetTotal = eigyouData.reduce((sum, val) => sum + val, 0);
                          const difference = actualTotal - targetTotal;

                          return (
                            <div className="py-1">
                              <div className="text-lg font-bold">{targetTotal.toFixed(1)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{targetTotal.toFixed(1)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{difference.toFixed(1)}万
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 月別合計（全て）行 */}
              <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-blue-200">月別合計（全て）</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  return (
                    <>
                      {months.map(month => {
                        const monthOrders = filteredOrders.filter(o => o.deliveryMonth === month.value && o.status !== '失注');
                        const amount = monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-blue-200">
                        {(() => {
                          const total = filteredOrders.filter(o => o.status !== '失注');
                          const amount = total.reduce((sum, o) => sum + (o.amount || 0), 0);
                          const targetAmount = total.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                          const difference = amount - targetAmount;

                          return (
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 累計（全て）行 */}
              <tr className="bg-blue-100 font-bold">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-blue-200">累計（全て）</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  let cumulativeAmount = 0;
                  let cumulativeTarget = 0;

                  return (
                    <>
                      {months.map(month => {
                        const monthOrders = filteredOrders.filter(o => o.deliveryMonth === month.value && o.status !== '失注');
                        const monthAmount = monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const monthTarget = monthOrders.reduce((sum, o) => sum + (o.targetAmount || 0), 0);

                        cumulativeAmount += monthAmount;
                        cumulativeTarget += monthTarget;
                        const difference = cumulativeAmount - cumulativeTarget;

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900 bg-blue-100">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(cumulativeAmount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(cumulativeTarget)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-blue-200">
                        <div>-</div>
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 月別合計（AB）行 */}
              <tr className="bg-blue-50 font-bold">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-blue-100">月別合計（AB）</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  return (
                    <>
                      {months.map(month => {
                        const monthOrdersAB = filteredOrders.filter(o => o.deliveryMonth === month.value && ['A', 'B'].includes(o.rank));
                        const amount = monthOrdersAB.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const targetAmount = monthOrdersAB.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                        const difference = amount - targetAmount;

                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-blue-100">
                        {(() => {
                          const totalAB = filteredOrders.filter(o => ['A', 'B'].includes(o.rank));
                          const amount = totalAB.reduce((sum, o) => sum + (o.amount || 0), 0);
                          const targetAmount = totalAB.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                          const difference = amount - targetAmount;

                          return (
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(amount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(targetAmount)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </>
                  );
                })()}
              </tr>

              {/* 累計（AB）行 */}
              <tr className="bg-blue-50 font-bold border-b-2 border-blue-300">
                <td className="px-4 py-3 text-center border text-gray-700 bg-gray-50 w-12">-</td>
                <td className="px-4 py-3 border text-gray-900 bg-blue-100">累計（AB）</td>
                {(() => {
                  const filteredOrders = getFilteredOrders();
                  let cumulativeAmount = 0;
                  let cumulativeTarget = 0;
                  let debugOutput = {};

                  return (
                    <>
                      {months.map(month => {
                        const monthOrdersAB = filteredOrders.filter(o => o.deliveryMonth === month.value && ['A', 'B'].includes(o.rank));
                        const monthAmount = monthOrdersAB.reduce((sum, o) => sum + (o.amount || 0), 0);
                        const monthTarget = monthOrdersAB.reduce((sum, o) => sum + (o.targetAmount || 0), 0);

                        cumulativeAmount += monthAmount;
                        cumulativeTarget += monthTarget;
                        const difference = cumulativeAmount - cumulativeTarget;


                        return (
                          <td key={month.value} className="px-4 py-3 text-center border text-gray-900 bg-blue-50">
                            <div className="py-1">
                              <div className="text-lg font-bold">{displayAmount(cumulativeAmount)}万</div>
                              <div className="text-xs text-gray-600 leading-tight">
                                /{displayAmount(cumulativeTarget)}万
                              </div>
                              <div className={`text-xs font-semibold leading-tight ${difference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{displayAmount(difference)}万
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border text-gray-900 bg-blue-100">
                        <div>-</div>
                      </td>
                    </>
                  );
                })()}
              </tr>

            </tbody>
          </table>
        </div>

        {/* 四半期集計 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-x-auto quarterly-summary">
          <h2 className="text-2xl font-bold text-white bg-orange-600 p-6 pb-4 rounded-t-lg">📊 四半期集計</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-700 text-white">
                <th className="px-4 py-4 text-left font-bold border text-lg">四半期</th>
                <th className="px-4 py-4 text-center font-bold border text-lg">見込み</th>
                <th className="px-4 py-4 text-center font-bold border text-lg">目標</th>
                <th className="px-4 py-4 text-center font-bold border text-lg">差分</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredOrders = getFilteredOrders();

                // 四半期の定義と色設定
                const quarters = selectedYear === '2025-2026'
                  ? [
                      { name: '第1Q（10-12月）', months: ['2025-10', '2025-11', '2025-12'], bgColor: 'bg-red-50', headerColor: 'bg-red-600' },
                      { name: '第2Q（1-3月）', months: ['2026-01', '2026-02', '2026-03'], bgColor: 'bg-yellow-50', headerColor: 'bg-yellow-600' },
                      { name: '第3Q（4-6月）', months: ['2026-04', '2026-05', '2026-06'], bgColor: 'bg-green-50', headerColor: 'bg-green-600' },
                      { name: '第4Q（7-9月）', months: ['2026-07', '2026-08', '2026-09'], bgColor: 'bg-blue-50', headerColor: 'bg-blue-600' },
                    ]
                  : [
                      { name: '第1Q（10-12月）', months: ['2026-10', '2026-11', '2026-12'], bgColor: 'bg-red-50', headerColor: 'bg-red-600' },
                      { name: '第2Q（1-3月）', months: ['2027-01', '2027-02', '2027-03'], bgColor: 'bg-yellow-50', headerColor: 'bg-yellow-600' },
                      { name: '第3Q（4-6月）', months: ['2027-04', '2027-05', '2027-06'], bgColor: 'bg-green-50', headerColor: 'bg-green-600' },
                      { name: '第4Q（7-9月）', months: ['2027-07', '2027-08', '2027-09'], bgColor: 'bg-blue-50', headerColor: 'bg-blue-600' },
                    ];

                return quarters.flatMap(quarter => {
                  // 全て（全て失注以外）
                  const quarterOrdersAll = filteredOrders.filter(o =>
                    quarter.months.includes(o.deliveryMonth) && o.status !== '失注'
                  );
                  const amountAll = quarterOrdersAll.reduce((sum, o) => sum + (o.amount || 0), 0);
                  const targetAmountAll = quarterOrdersAll.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                  const differenceAll = amountAll - targetAmountAll;

                  // 受注済み + 進行中 + 確度AB
                  const quarterOrdersAB = filteredOrders.filter(o =>
                    quarter.months.includes(o.deliveryMonth) && ['受注済み', '進行中'].includes(o.status) && ['A', 'B'].includes(o.rank)
                  );
                  const amountAB = quarterOrdersAB.reduce((sum, o) => sum + (o.amount || 0), 0);
                  const targetAmountAB = quarterOrdersAB.reduce((sum, o) => sum + (o.targetAmount || 0), 0);
                  const differenceAB = amountAB - targetAmountAB;

                  return [
                    // （全て）行
                    <tr key={`${quarter.name}-all`} className={`${quarter.bgColor} border-b hover:opacity-80`}>
                      <td className={`px-4 py-5 font-bold border ${quarter.headerColor} text-white text-lg`}>
                        {quarter.name}（全て）
                      </td>
                      <td className="px-4 py-5 text-center border">
                        <div className="text-2xl font-bold text-green-700">{displayAmount(amountAll)}万</div>
                      </td>
                      <td className="px-4 py-5 text-center border">
                        <div className="text-2xl font-bold text-gray-800">{displayAmount(targetAmountAll)}万</div>
                      </td>
                      <td className="px-4 py-5 text-center border font-bold text-2xl text-gray-800">
                        <div>{differenceAll >= 0 ? '+' : ''}{displayAmount(differenceAll)}万</div>
                      </td>
                    </tr>,
                    // （確度AB）行
                    <tr key={`${quarter.name}-ab`} className={`${quarter.bgColor} border-b hover:opacity-80`}>
                      <td className={`px-4 py-5 font-bold border ${quarter.headerColor} text-white text-lg rounded-l`}>
                        {quarter.name}（確度AB）
                      </td>
                      <td className="px-4 py-5 text-center border">
                        <div className="text-2xl font-bold text-blue-700">{displayAmount(amountAB)}万</div>
                      </td>
                      <td className="px-4 py-5 text-center border">
                        <div className="text-2xl font-bold text-gray-800">{displayAmount(targetAmountAB)}万</div>
                      </td>
                      <td className="px-4 py-5 text-center border font-bold text-2xl rounded-r text-gray-800">
                        <div>{differenceAB >= 0 ? '+' : ''}{displayAmount(differenceAB)}万</div>
                      </td>
                    </tr>
                  ];
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 印刷ダイアログ */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">印刷設定</h2>
              <button
                onClick={() => setShowPrintDialog(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedPrintSections.table}
                  onChange={(e) => setSelectedPrintSections({
                    ...selectedPrintSections,
                    table: e.target.checked
                  })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">ダッシュボードテーブル</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedPrintSections.quarterly}
                  onChange={(e) => setSelectedPrintSections({
                    ...selectedPrintSections,
                    quarterly: e.target.checked
                  })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">四半期集計</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPrintDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  handlePrint();
                  setShowPrintDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                印刷
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ドリルダウンモーダル */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCell.customer} - {selectedCell.month}
              </h2>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {selectedCell.orders.length === 0 ? (
                <p className="text-gray-500">案件がありません</p>
              ) : (
                <div className="space-y-4">
                  {selectedCell.orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded p-4">
                      {editingOrder?.id === order.id && editMode ? (
                        // 編集モード
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">実績金額（万円）</label>
                            <input
                              type="number"
                              step="0.01"
                              value={selectedYear === '2025-2026' ? editingOrder.amount / 10000 : editingOrder.amount}
                              onChange={(e) => {
                                const inputValue = parseFloat(e.target.value);
                                const dbValue = selectedYear === '2025-2026' ? inputValue * 10000 : inputValue;
                                setEditingOrder({
                                  ...editingOrder,
                                  amount: dbValue
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">目標金額（万円）</label>
                            <input
                              type="number"
                              step="0.01"
                              value={selectedYear === '2025-2026' ? editingOrder.targetAmount / 10000 : editingOrder.targetAmount}
                              disabled={true}
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">ランク</label>
                            <select
                              value={editingOrder.rank}
                              onChange={(e) => setEditingOrder({...editingOrder, rank: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                            >
                              <option>A</option>
                              <option>B</option>
                              <option>C</option>
                              <option>D</option>
                              <option>E</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">ステータス</label>
                            <select
                              value={editingOrder.status || '進行中'}
                              onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                            >
                              <option>進行中</option>
                              <option>失注</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await fetch('http://localhost:3001/api/orders', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify(editingOrder)
                                  });
                                  setEditMode(false);
                                  setEditingOrder(null);
                                  // データ再取得
                                  const response = await fetch('http://localhost:3001/api/orders');
                                  setOrders(await response.json());
                                } catch (error) {
                                  console.error('更新エラー:', error);
                                  alert('更新に失敗しました');
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditMode(false);
                                setEditingOrder(null);
                              }}
                              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{order.name}</h3>
                              <p className="text-sm text-gray-600">金額：{displayAmount(order.amount)}万円</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingOrder(order);
                                  setEditMode(true);
                                }}
                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleShowAudit(order.id)}
                                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                履歴
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === '失注' ? 'bg-gray-200 text-gray-700' :
                              order.rank === 'A' ? 'bg-blue-900 text-white' :
                              order.rank === 'B' ? 'bg-blue-500 text-white' :
                              order.rank === 'C' ? 'bg-amber-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {order.status || '進行中'} / ランク{order.rank}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 監査ログモーダル */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">更新履歴</h2>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {auditLogs.length === 0 ? (
                <p className="text-gray-500">更新履歴がありません</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map(log => (
                    <div key={log.id} className="border-l-4 border-blue-900 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{log.changedField}</p>
                          <p className="text-sm text-gray-600">
                            {log.oldValue} → {log.newValue}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">{log.updatedBy}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(log.updatedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print CSS */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .p-8 { padding: 20px !important; }
          .dashboard-table { break-inside: avoid; }
          .quarterly-summary { break-inside: avoid; }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

export default CustomerMonthlyDashboard;
