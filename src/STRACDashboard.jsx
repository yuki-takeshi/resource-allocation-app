import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { fetchSTRACDashboard } from './api';

const STRACDashboard = () => {
  const [baseMonth, setBaseMonth] = useState(() => {
    const saved = localStorage.getItem('stracBaseMonth');
    if (saved) return saved;
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [spanMonths, setSpanMonths] = useState(3);
  const [stracData, setStracData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRiskMonth, setSelectedRiskMonth] = useState(null);

  // 期間選択を localStorage に保存
  useEffect(() => {
    localStorage.setItem('stracBaseMonth', baseMonth);
  }, [baseMonth]);

  // STRACデータ取得
  useEffect(() => {
    loadSTRACData();
  }, [baseMonth, spanMonths]);

  const loadSTRACData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSTRACDashboard(baseMonth, spanMonths);
      setStracData(data);
    } catch (err) {
      setError(`データ取得エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 前月へ
  const goToPreviousMonth = () => {
    const [year, month] = baseMonth.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setBaseMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // 次月へ
  const goToNextMonth = () => {
    const [year, month] = baseMonth.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setBaseMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // 当月へ
  const goToToday = () => {
    const today = new Date();
    setBaseMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  };

  const getStatusColor = (achievementRate) => {
    if (achievementRate >= 100) return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' };
    if (achievementRate >= 90) return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' };
    if (achievementRate >= 70) return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' };
    return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' };
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 'C': return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'D': return 'bg-orange-50 border-l-4 border-orange-400';
      case 'E': return 'bg-red-50 border-l-4 border-red-400';
      default: return 'bg-gray-50';
    }
  };

  if (loading && !stracData) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">エラー: {error}</div>;
  }

  if (!stracData) {
    return <div className="p-6 text-gray-600">データがありません</div>;
  }

  const { months, summary } = stracData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-sm font-bold text-gray-900">📊 STRAC受注残ダッシュボード</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setSpanMonths(3)}
              className={`px-4 py-2 rounded font-medium ${spanMonths === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              3ヶ月
            </button>
            <button
              onClick={() => setSpanMonths(6)}
              className={`px-4 py-2 rounded font-medium ${spanMonths === 6 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              6ヶ月
            </button>
            <button
              onClick={() => setSpanMonths(12)}
              className={`px-4 py-2 rounded font-medium ${spanMonths === 12 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              12ヶ月
            </button>
          </div>
        </div>

        {/* 期間コントローラー */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="month"
            value={baseMonth}
            onChange={(e) => setBaseMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={goToToday}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            当月へ戻る
          </button>
        </div>
      </div>

      {/* 3ヶ月合計サマリー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow p-6 mb-6 text-white">
        <h2 className="text-sm font-bold mb-4">📈 {spanMonths}ヶ月合計サマリー</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm opacity-90">前期末残</p>
            <p className={`text-sm font-bold ${summary.totalCarryover >= 0 ? '' : 'text-red-200'}`}>{summary.totalCarryover.toFixed(1)}万</p>
          </div>
          <div>
            <p className="text-sm opacity-90">新規受注（A/B）</p>
            <p className={`text-sm font-bold ${summary.totalNewOrders >= 0 ? '' : 'text-red-200'}`}>{summary.totalNewOrders.toFixed(1)}万</p>
          </div>
          <div>
            <p className="text-sm opacity-90">目標</p>
            <p className={`text-sm font-bold ${summary.totalTarget >= 0 ? '' : 'text-red-200'}`}>{summary.totalTarget.toFixed(1)}万</p>
          </div>
          <div>
            <p className="text-sm opacity-90">期末残</p>
            <p className={`text-sm font-bold ${summary.totalEndBalance >= 0 ? '' : 'text-red-200'}`}>{summary.totalEndBalance.toFixed(1)}万</p>
          </div>
          <div>
            <p className="text-sm opacity-90">達成率</p>
            <p className="text-sm font-bold">{summary.averageAchievementRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 月別STRAC図（横に3つ並び） */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {months.map((month, idx) => {
          const status = getStatusColor(month.achievementRate);
          const shortfall = Math.max(0, month.monthlyTarget - month.totalIN);

          return (
            <div key={idx} className={`bg-white rounded-lg shadow-lg border-4 ${status.border}`}>
              {/* 月のタイトル */}
              <div className="bg-gray-100 px-3 py-2 border-b-2 border-gray-300">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-gray-900">{month.month}</h3>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">目標: {month.monthlyTarget.toFixed(1)}万</p>
                  </div>
                </div>
                <div className={`text-xs font-bold mt-1 ${status.text}`}>
                  達成率: {month.achievementRate.toFixed(1)}%
                </div>
              </div>

              {/* STRAC図（上下2段×左右2列、各セルの高さを比率に応じて調整） */}
              {(() => {
                const leftTotal = Math.max(1, month.carryover + month.newOrders);
                const rightTotal = Math.max(1, month.monthlyTarget + month.endBalance);

                // 左側：前月末残と当月新規の比率
                const leftCarryoverPercent = (month.carryover / leftTotal) * 100;
                const leftNewOrdersPercent = (month.newOrders / leftTotal) * 100;

                // 右側：当月目標と当月末残の比率
                const rightTargetPercent = (month.monthlyTarget / rightTotal) * 100;
                const rightEndBalancePercent = (month.endBalance / rightTotal) * 100;

                return (
                  <div className="flex gap-0 border-t-4 border-l-4 border-gray-400" style={{ height: '650px' }}>
                    {/* 左側コンテナ（前月末残 + 当月新規） */}
                    <div className="flex flex-col flex-1">
                      {/* 左上：前月末残 */}
                      <div
                        style={{ height: `${leftCarryoverPercent}%`, minHeight: '65px' }}
                        className="border-r-4 border-b-4 border-gray-400 p-2 flex flex-col justify-center bg-blue-100 overflow-hidden"
                      >
                        <p className="text-xs font-bold text-gray-600 mb-1 truncate">前月末残</p>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-sm font-bold ${month.carryover >= 0 ? 'text-blue-600' : 'text-red-600'} truncate`}>{month.carryover.toFixed(1)}</p>
                          <p className="text-xs text-gray-500 truncate">万</p>
                        </div>
                      </div>

                      {/* 左下：当月新規 */}
                      <div
                        style={{ height: `${leftNewOrdersPercent}%`, minHeight: '65px' }}
                        className="border-r-4 border-b-4 border-gray-400 p-2 flex flex-col justify-center bg-yellow-100 overflow-hidden"
                      >
                        <p className="text-xs font-bold text-gray-600 mb-1 truncate">当月新規</p>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-sm font-bold ${month.newOrders >= 0 ? 'text-green-600' : 'text-red-600'} truncate`}>{month.newOrders.toFixed(1)}</p>
                          <p className="text-xs text-gray-500 truncate">万</p>
                        </div>
                      </div>
                    </div>

                    {/* 右側コンテナ（当月目標 + 当月末残） */}
                    <div className="flex flex-col flex-1">
                      {/* 右上：当月OUT */}
                      <div
                        style={{ height: `${rightTargetPercent}%`, minHeight: '65px' }}
                        className="border-r-4 border-b-4 border-gray-400 p-2 flex flex-col justify-center bg-green-100 overflow-hidden"
                      >
                        <p className="text-xs font-bold text-gray-600 mb-1 truncate">当月OUT</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm font-bold text-blue-600 truncate">{month.monthlyTarget.toFixed(1)}</p>
                          <p className="text-xs text-gray-500 truncate">万</p>
                        </div>
                      </div>

                      {/* 右下：当月末残 */}
                      <div
                        style={{ height: `${rightEndBalancePercent}%`, minHeight: '65px' }}
                        className="border-r-4 border-b-4 border-gray-400 p-2 flex flex-col justify-center bg-orange-100 overflow-hidden"
                      >
                        <p className="text-xs font-bold text-gray-600 mb-1 truncate">当月末残</p>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-sm font-bold ${month.endBalance >= 0 ? 'text-green-600' : 'text-red-600'} truncate`}>
                            {month.endBalance.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">万</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 説明文 */}
              <div className="px-3 py-2 bg-gray-50 border-t-2 border-gray-300 text-xs text-gray-600">
                <p>左（IN） = 右（OUT+残）</p>
              </div>

              {/* 合計金額 */}
              <div className="grid grid-cols-2 gap-0 px-3 py-2 bg-white">
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{(month.carryover + month.newOrders).toFixed(1)}万</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{(month.monthlyTarget + month.endBalance).toFixed(1)}万</p>
                </div>
              </div>

              {/* 不足分警告 */}
              {shortfall > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="text-red-700 font-bold space-y-1">
                    <p>当月目標　：{month.monthlyTarget.toFixed(1)}万円</p>
                    <p>当月OUT　：{month.totalIN.toFixed(1)}万円</p>
                    <p>不足額　：{shortfall.toFixed(1)}万円</p>
                  </div>
                  <p className="text-red-600 text-sm mt-2">
                    {month.riskPoolAmount >= shortfall
                      ? `✓ 受注残プールで補填可能（${month.riskPoolAmount.toFixed(1)}万利用可）`
                      : `✗ 受注残プールでは不足（必要: ${shortfall.toFixed(1)}万 > 利用可: ${month.riskPoolAmount.toFixed(1)}万）`
                    }
                  </p>
                </div>
              )}

              {/* リスク案件プール（常時表示） */}
              <div className="px-4 py-3 bg-gray-100 font-medium text-gray-700">
                ▼ リスク案件プール（C/D/E: {month.riskPoolAmount.toFixed(1)}万）
              </div>

              {/* リスク案件詳細（常時表示） */}
              {month.riskPool.length > 0 ? (
                <div className="p-4 space-y-2">
                  {month.riskPool.map((order, oidx) => (
                    <div key={oidx} className={`p-3 rounded text-sm ${getRankColor(order.rank)}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{order.name}</p>
                          <p className="text-gray-600">{order.customer}</p>
                          <p className="text-xs text-gray-500">ランク: <span className="font-bold">{order.rank}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{order.amount.toFixed(1)}万</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-gray-500 text-center">リスク案件なし</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3ヶ月の新規受注一覧（A/B） */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">📋 {spanMonths}ヶ月の新規受注一覧（A/B）</h2>
        {stracData.newOrdersList && stracData.newOrdersList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">受注日</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">案件名</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">顧客</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold">ランク</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-bold">金額</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">納期月</th>
                </tr>
              </thead>
              <tbody>
                {stracData.newOrdersList.map((order, idx) => (
                  <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{order.orderDate}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{order.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{order.customer}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded font-bold text-white ${order.rank === 'A' ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {order.rank}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">{order.amount.toFixed(1)}万</td>
                    <td className="border border-gray-300 px-4 py-2">{order.deliveryMonth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">受注がありません</p>
        )}
      </div>
    </div>
  );
};

export default STRACDashboard;
