import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function CustomerMonthlyDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [draggedRow, setDraggedRow] = useState(null);
  const [customerOrder, setCustomerOrder] = useState([]);

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
  const getUniqueCustomers = () => {
    const filteredOrders = getFilteredOrders();
    const customerSet = new Set(filteredOrders.map(o => o.customer).filter(Boolean));
    const uniqueCustomers = Array.from(customerSet).sort();

    return uniqueCustomers;
  };

  // カスタマーオーダーの初期化（期間切り替え時にリセット）
  useEffect(() => {
    const uniqueCustomers = getUniqueCustomers();
    if (uniqueCustomers.length > 0) {
      setCustomerOrder(uniqueCustomers);
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
      // customerOrder に含まれる顧客
      const orderedCustomers = customerOrder.filter(c => regularCustomers.includes(c));

      // customerOrder に含まれない顧客（新規顧客）- アルファベット順でソート
      const newCustomers = regularCustomers.filter(c => !customerOrder.includes(c)).sort();

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
      const regularCustomers = uniqueCustomers.filter(c => !SALES_CATEGORIES.includes(c) && !LOCKED_CUSTOMERS.includes(c));

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
    const displayCustomers = getDisplayCustomers();
    const uniqueCustomers = getUniqueCustomers();
    const regularCustomers = uniqueCustomers.filter(c => !SALES_CATEGORIES.includes(c) && !LOCKED_CUSTOMERS.includes(c));

    // 新規顧客（customerOrder に含まれない）
    const newCustomers = regularCustomers.filter(c => !customerOrder.includes(c)).sort();

    // 白地の位置を見つけて、その下に新規顧客を挿入
    if (newCustomers.length > 0) {
      const lockedIndex = displayCustomers.indexOf('白地');
      if (lockedIndex !== -1) {
        const result = [...displayCustomers];
        result.splice(lockedIndex + 1, 0, ...newCustomers);
        return result;
      }
    }

    return displayCustomers;
  })();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">月別×顧客別ダッシュボード</h1>

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
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table key={selectedYear} className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
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
              {customers.map(customer => {
                const filteredOrders = getFilteredOrders();
                const isLossCustomer = filteredOrders
                  .filter(o => o.customer === customer)
                  .every(o => o.status === '失注');

                const isRowSelected = selectedRow === customer;
                const isRowDragged = draggedRow === customer;

                // ドラッグ可能かどうか：営業部分類（BPマッチング、MRAG）のみドラッグ不可
                // 白地と新規顧客はドラッグ可能
                const isDraggable = !SALES_CATEGORIES.includes(customer);

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
                          onClick={() => handleCellClick(customer, month.value)}
                          className={`px-4 py-3 text-center border cursor-pointer transition ${
                            isCellSelected ? 'bg-blue-300' : isRowSelected ? 'bg-blue-100' : 'hover:bg-blue-50'
                          } ${isLoss ? 'bg-gray-200 text-gray-500' : ''}`}
                        >
                          {amount > 0 || targetAmount > 0 ? (
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
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 text-center font-bold border ${
                      isRowSelected ? 'bg-blue-200' : ''
                    } ${isLossCustomer ? 'text-gray-500' : ''}`}>
                      {displayAmount(filteredOrders
                        .filter(o => o.customer === customer && o.status !== '失注')
                        .reduce((sum, o) => sum + (o.amount || 0), 0))}万
                    </td>
                  </tr>
                );
              })}

              {/* 既存ビジネス計行 - 通常顧客 + 新規現場（営業部と白地を除外） */}
              <tr className="bg-yellow-100 font-bold">
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
                return (
                  <tr key={customer} className="bg-gray-100 font-bold">
                    <td
                      onClick={() => setSelectedRow(customer)}
                      className={`px-4 py-3 font-medium border cursor-default ${
                        isRowSelected ? 'bg-gray-300 font-bold' : 'bg-gray-200'
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
                      isRowSelected ? 'bg-gray-300' : 'bg-gray-200'
                    }`}>
                      {displayAmount(getFilteredOrders()
                        .filter(o => o.customer === customer && o.status !== '失注')
                        .reduce((sum, o) => sum + (o.amount || 0), 0))}万
                    </td>
                  </tr>
                );
              })}

              {/* 新規顧客行（白地の下） */}
              {(() => {
                const uniqueCustomers = getUniqueCustomers();
                const regularCustomers = uniqueCustomers.filter(c => !SALES_CATEGORIES.includes(c) && !LOCKED_CUSTOMERS.includes(c));
                const newCustomers = regularCustomers.filter(c => !customerOrder.includes(c)).sort();

                return newCustomers.map(customer => {
                  const filteredOrders = getFilteredOrders();
                  const isLossCustomer = filteredOrders
                    .filter(o => o.customer === customer)
                    .every(o => o.status === '失注');

                  const isRowSelected = selectedRow === customer;
                  const isRowDragged = draggedRow === customer;
                  const isDraggable = !SALES_CATEGORIES.includes(customer);

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
                      onDrop={(e) => {
                        if (isDraggable) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDrop(e, customer);
                        }
                      }}
                      className={`border-b transition ${
                        isRowDragged ? 'opacity-50 bg-blue-200' : ''
                      } ${
                        isRowSelected ? 'bg-blue-100' : isLossCustomer ? 'bg-gray-100' : ''
                      } ${isDraggable && !isRowDragged ? 'cursor-grab hover:cursor-grab' : isDraggable && isRowDragged ? 'cursor-grabbing' : 'cursor-default'}`}
                    >
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
                        const isCellSelected = selectedCell?.customer === customer && selectedCell?.month === month.value;

                        return (
                          <td
                            key={month.value}
                            onClick={() => handleCellClick(customer, month.value)}
                            className={`px-4 py-3 text-center border cursor-pointer transition ${
                              isCellSelected ? 'bg-blue-300' : isRowSelected ? 'bg-blue-100' : 'hover:bg-blue-50'
                            } ${isLossCustomer ? 'bg-gray-200 text-gray-500' : ''}`}
                          >
                            {amount > 0 || targetAmount > 0 ? (
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
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className={`px-4 py-3 text-center font-bold border ${
                        isRowSelected ? 'bg-blue-200' : ''
                      }`}>
                        {displayAmount(getFilteredOrders()
                          .filter(o => o.customer === customer && o.status !== '失注')
                          .reduce((sum, o) => sum + (o.amount || 0), 0))}万
                      </td>
                    </tr>
                  );
                });
              })()}

              {/* 開発事業部目標合計行 - 既存ビジネス計 + 白地 + 新規現場 */}
              <tr className="bg-purple-100 font-bold">
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

              {/* 月別合計（AB）行 */}
              <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
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

              {/* 月別合計（全て）行 */}
              <tr className="bg-blue-100 font-bold border-b-2 border-blue-300">
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

            </tbody>
          </table>
        </div>
      </div>

      {/* ドリルダウンモーダル */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
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
    </div>
  );
}

export default CustomerMonthlyDashboard;
