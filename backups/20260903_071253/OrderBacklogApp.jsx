import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, AlertCircle, X, TrendingUp,
  Calendar, DollarSign, AlertTriangle, Copy, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Bar, Line, ComposedChart, LineChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchOrders, saveOrder, deleteOrder, fetchTargets, saveTarget, deleteTarget, fetchLog, saveLog, fetchSnapshots, saveSnapshot } from './api';

const DEPARTMENTS = ['All', 'オープン１課', 'オープン２課', 'DX課', '保守課', '受託事業部', '営業部'];
const RANK_COLORS = {
  A: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-300', dot: '#1e40af' },
  B: { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-300', dot: '#3b82f6' },
  C: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-300', dot: '#f59e0b' },
  D: { bg: 'bg-gray-50', text: 'text-red-600', border: 'border-gray-300', dot: '#ef4444' },
  E: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300', dot: '#6b7280' }
};

const INITIAL_ORDERS = [
  { id: 1, name: '基幹システム刷新', customer: 'A社', amount: 12000000, orderDate: '2025-12-01', deliveryMonth: '2026-06', department: 'オープン１課', rank: 'A', status: '進行中' },
  { id: 2, name: 'ECサイト構築', customer: 'B社', amount: 8500000, orderDate: '2026-01-15', deliveryMonth: '2026-07', department: 'オープン２課', rank: 'B', status: '進行中' },
  { id: 3, name: 'データ分析基盤', customer: 'C社', amount: 6000000, orderDate: '2025-11-10', deliveryMonth: '2026-08', department: 'DX課', rank: 'C', status: '進行中' },
  { id: 4, name: 'モバイルアプリ開発', customer: 'D社', amount: 4500000, orderDate: '2026-02-20', deliveryMonth: '2026-06', department: '保守課', rank: 'A', status: '進行中' },
  { id: 5, name: 'セキュリティ監査', customer: 'E社', amount: 2000000, orderDate: '2025-10-05', deliveryMonth: '2026-09', department: '受託事業部', rank: 'D', status: '進行中' }
];

function formatCurrency(value) {
  return `${Math.floor(value / 10000)}万円`;
}

function formatCurrencyFull(value) {
  return `${Math.floor(value / 10000).toLocaleString('ja-JP')}万円`;
}

function getMonthsAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

function isStuckOrder(order) {
  const monthsAgo = getMonthsAgo(order.orderDate);
  return monthsAgo >= 3 && ['B', 'C', 'D'].includes(order.rank);
}

function OrderForm({ order, onSave, onCancel }) {
  const [formData, setFormData] = useState(order ? { ...order } : {
    name: '',
    customer: '',
    amount: '',
    orderDate: '',
    deliveryMonth: '',
    department: 'オープン１課',
    rank: 'A',
    remarks: '',
    status: '進行中',
    lossDate: '',
    lossReason: ''
  });

  const [registerMode, setRegisterMode] = useState('single'); // 'single' or 'period'
  const [periodEndMonth, setPeriodEndMonth] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        amount: value === '' ? '' : Math.round((parseFloat(value) || 0) * 10000)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.customer || formData.amount === '' || !formData.orderDate || !formData.deliveryMonth) {
      alert('すべての項目を入力してください');
      return;
    }

    // 期間指定モードの場合、終了月を確認
    if (registerMode === 'period' && !periodEndMonth) {
      alert('期間指定モードの場合、期間終了月を入力してください');
      return;
    }

    // 期間指定モードの場合、deliveryMonth <= periodEndMonth を確認
    if (registerMode === 'period' && periodEndMonth && formData.deliveryMonth > periodEndMonth) {
      alert('期間終了月は予定納期月以降に設定してください');
      return;
    }

    // registerMode と periodEndMonth をフォームデータに含める
    onSave({
      ...formData,
      registerMode,
      periodEndMonth
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{order ? '案件編集' : '案件追加'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">案件名 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="基幹システム刷新"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">顧客名 *</label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="A社"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">受注金額（万円） *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="amount"
                step="0.1"
                value={formData.amount === '' ? '' : formData.amount / 10000}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="120"
              />
              <span className="text-sm text-gray-600 font-medium">万円</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">受注日 *</label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">予定納期月 *</label>
              <input
                type="month"
                name="deliveryMonth"
                value={formData.deliveryMonth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当部署 *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {DEPARTMENTS.filter(d => d !== 'All').map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ランク *</label>
              <select
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="A">A（確実）</option>
                <option value="B">B（見込み高い）</option>
                <option value="C">C（検討中）</option>
                <option value="D">D（課題あり）</option>
                <option value="E">E（その他）</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="進行中">進行中</option>
              <option value="受注済み">受注済み</option>
              <option value="延期">延期</option>
              <option value="失注">失注</option>
            </select>
          </div>

          {formData.status === '失注' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-red-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">失注日</label>
                <input
                  type="date"
                  name="lossDate"
                  value={formData.lossDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">失注理由</label>
                <input
                  type="text"
                  name="lossReason"
                  value={formData.lossReason}
                  onChange={handleChange}
                  placeholder="競合負け、予算削減など"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">備考</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="追加の情報や注記などを記入してください"
              rows="4"
            />
          </div>

          {!order && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">登録方法</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="registerMode"
                      value="single"
                      checked={registerMode === 'single'}
                      onChange={(e) => setRegisterMode(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">単月登録</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="registerMode"
                      value="period"
                      checked={registerMode === 'period'}
                      onChange={(e) => setRegisterMode(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">期間指定（複数月自動作成）</span>
                  </label>
                </div>
              </div>

              {registerMode === 'period' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">期間終了月 *</label>
                  <input
                    type="month"
                    value={periodEndMonth}
                    onChange={(e) => setPeriodEndMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-2">予定納期月から期間終了月までの間、毎月案件を作成します</p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {order ? '更新' : '追加'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderBacklogApp() {
  const [orders, setOrders] = useState([]);
  const [monthlyTargets, setMonthlyTargets] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showOrderForm, setShowOrderForm] = useState(false);

  // 折り畳み状態管理
  const [expandedSections, setExpandedSections] = useState({
    trend: true,
    rankDistribution: true,
    monthlyComparison: true,
    targetSettings: true,
    expectationVsTarget: true,
    analysis: true
  });

  // セクション折り畳みトグル
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [editingOrder, setEditingOrder] = useState(null);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [newTargetMonth, setNewTargetMonth] = useState('');
  const [newTargetDepartment, setNewTargetDepartment] = useState('オープン１課');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [sortBy, setSortBy] = useState('amount-desc');
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [filterRanks, setFilterRanks] = useState(['A', 'B', 'C', 'D', 'E']);
  const [searchOrderName, setSearchOrderName] = useState('');
  const [expandActivityLog, setExpandActivityLog] = useState(false);
  const [expandLossOrders, setExpandLossOrders] = useState(false);
  const [expandCompletedOrders, setExpandCompletedOrders] = useState(false);
  const [periodStart, setPeriodStart] = useState(localStorage.getItem('periodStart') || '2026-01');
  const [periodEnd, setPeriodEnd] = useState(localStorage.getItem('periodEnd') || '2026-12');
  const [tempPeriodStart, setTempPeriodStart] = useState(periodStart);
  const [tempPeriodEnd, setTempPeriodEnd] = useState(periodEnd);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotPeriod, setSnapshotPeriod] = useState('3months');
  const [expandedGroups, setExpandedGroups] = useState({});

  // API からデータを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const ordersData = await fetchOrders();
        const targetsData = await fetchTargets();
        const logData = await fetchLog();
        const snapshotsData = await fetchSnapshots();

        setOrders(ordersData || []);
        setMonthlyTargets(Array.isArray(targetsData) ? targetsData : []);
        setActivityLog(logData || []);
        setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setOrders(INITIAL_ORDERS);
      }
    };

    loadData();
  }, []);

  // 日次スナップショット作成
  useEffect(() => {
    const createDailySnapshot = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const existingSnapshot = snapshots.find(s => s.date === today && s.department === 'All');

        if (!existingSnapshot) {
          const activeOrders = orders.filter(o => o.status === '進行中');
          const totalAmount = activeOrders.reduce((sum, o) => sum + o.amount, 0);
          const snapshotId = `snapshot-${today}-All`;
          const now = new Date().toLocaleString('ja-JP');

          await saveSnapshot(snapshotId, today, 'All', totalAmount, now);
          setSnapshots(prev => [...prev, { id: snapshotId, date: today, department: 'All', totalAmount, created_at: now }]);
        }
      } catch (error) {
        console.error('スナップショット作成エラー:', error);
      }
    };

    createDailySnapshot();
  }, [orders]);

  // 変更履歴を追加（API経由）
  const addLog = async (message, type) => {
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP');
    const logId = Date.now();

    const newLog = {
      id: logId,
      timestamp,
      message,
      type
    };

    // 即座に UI に反映
    setActivityLog(prev => [newLog, ...prev].slice(0, 50));

    // API に保存
    try {
      await saveLog(logId, timestamp, message, type);
    } catch (error) {
      console.error('ログ保存エラー:', error);
    }
  };

  // 案件を保存（API経由）
  const handleSaveOrder = async (formDataWithMode) => {
    try {
      let updatedOrders = [...orders];
      let logMessages = [];

      if (editingOrder) {
        // 編集時（単月のみ）
        const updatedOrder = { ...formDataWithMode, id: editingOrder.id };
        await saveOrder(updatedOrder);
        updatedOrders = orders.map(o => o.id === editingOrder.id ? updatedOrder : o);

        // 変更内容の詳細を記録
        const changes = [];
        if (editingOrder.amount !== formDataWithMode.amount) {
          changes.push(`金額: ¥${editingOrder.amount.toLocaleString('ja-JP')} → ¥${formDataWithMode.amount.toLocaleString('ja-JP')}`);
        }
        if (editingOrder.rank !== formDataWithMode.rank) {
          changes.push(`ランク: ${editingOrder.rank} → ${formDataWithMode.rank}`);
        }
        if (editingOrder.deliveryMonth !== formDataWithMode.deliveryMonth) {
          changes.push(`納期月: ${editingOrder.deliveryMonth} → ${formDataWithMode.deliveryMonth}`);
        }
        if (editingOrder.department !== formDataWithMode.department) {
          changes.push(`部署: ${editingOrder.department} → ${formDataWithMode.department}`);
        }
        if (editingOrder.customer !== formDataWithMode.customer) {
          changes.push(`顧客: ${editingOrder.customer} → ${formDataWithMode.customer}`);
        }
        if (editingOrder.name !== formDataWithMode.name) {
          changes.push(`案件名: ${editingOrder.name} → ${formDataWithMode.name}`);
        }
        if (editingOrder.status !== formDataWithMode.status) {
          if (formDataWithMode.status === '失注') {
            changes.push(`ステータス: ${editingOrder.status} → 失注（理由: ${formDataWithMode.lossReason || '未記入'}、失注日: ${formDataWithMode.lossDate}）`);
          } else {
            changes.push(`ステータス: ${editingOrder.status} → ${formDataWithMode.status}`);
          }
        }

        logMessages.push(changes.length > 0
          ? `「${formDataWithMode.name}」を更新（${changes.join('、')}）`
          : `「${formDataWithMode.name}」が更新されました`);
      } else {
        // 新規時
        const { registerMode: mode, periodEndMonth: endMonth, ...orderData } = formDataWithMode;

        if (mode === 'period' && endMonth) {
          // 期間指定での一括登録
          const startMonth = new Date(orderData.deliveryMonth);
          const end = new Date(endMonth);

          let currentMonth = new Date(startMonth);
          const createdMonths = [];

          while (currentMonth <= end) {
            const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
            const newOrder = { ...orderData, id: Date.now() + Math.random(), deliveryMonth: monthStr };
            await saveOrder(newOrder);
            updatedOrders.push(newOrder);
            createdMonths.push(monthStr);
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }

          logMessages.push(`「${orderData.name}」を${createdMonths.length}ヶ月分一括登録（${createdMonths.join('、')}）`);
        } else {
          // 単月登録
          const newOrder = { ...orderData, id: Date.now() };
          await saveOrder(newOrder);
          updatedOrders.push(newOrder);
          logMessages.push(`「${orderData.name}」が新規登録されました（金額: ¥${orderData.amount.toLocaleString('ja-JP')}）`);
        }
      }

      // State 更新を同期的に実行
      setOrders(updatedOrders);
      for (const msg of logMessages) {
        await addLog(msg, editingOrder ? 'edit' : 'add');
      }
      setShowOrderForm(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('案件保存エラー:', error);
      alert('案件の保存に失敗しました');
    }
  };

  // 案件を削除（API経由）
  const handleDeleteOrder = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (!window.confirm(`「${order.name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
      await addLog(`「${order.name}」が削除されました`, 'delete');
    } catch (error) {
      console.error('案件削除エラー:', error);
      alert('案件の削除に失敗しました');
    }
  };

  // 案件をコピー
  const handleCopyOrder = async (order) => {
    try {
      const copiedOrder = { ...order, id: Date.now() };
      await saveOrder(copiedOrder);
      setOrders([...orders, copiedOrder]);
      await addLog(`「${order.name}」を複製登録しました`, 'add');
    } catch (error) {
      console.error('複製失敗:', error);
      alert('複製に失敗しました');
    }
  };

  // 期間を設定
  const handleSetPeriod = () => {
    if (!tempPeriodStart || !tempPeriodEnd) {
      alert('開始月と終了月を入力してください');
      return;
    }
    if (tempPeriodStart > tempPeriodEnd) {
      alert('終了月は開始月以降に設定してください');
      return;
    }
    setPeriodStart(tempPeriodStart);
    setPeriodEnd(tempPeriodEnd);
    localStorage.setItem('periodStart', tempPeriodStart);
    localStorage.setItem('periodEnd', tempPeriodEnd);
  };

  // 目標を保存（API経由）
  const handleSaveTarget = async () => {
    if (!newTargetMonth || !newTargetAmount || !newTargetDepartment) return;
    try {
      const targetAmount = parseInt(newTargetAmount) || 0;
      const id = editingTarget?.id || `${newTargetMonth}-${newTargetDepartment}`;
      await saveTarget(id, newTargetMonth, newTargetDepartment, targetAmount);
      setMonthlyTargets(prev => {
        const targets = Array.isArray(prev) ? prev : [];
        const filtered = targets.filter(t => t.id !== id);
        return [...filtered, { id, month: newTargetMonth, department: newTargetDepartment, target: targetAmount }];
      });
      setNewTargetMonth('');
      setNewTargetDepartment('オープン１課');
      setNewTargetAmount('');
      setEditingTarget(null);
      setShowTargetForm(false);
    } catch (error) {
      console.error('目標保存エラー:', error);
      alert('目標の保存に失敗しました');
    }
  };

  // フィルタリング（ステータス・部署・期間・ランク・案件名）
  const filteredOrders = orders.filter(order => {
    // ステータスが「進行中」のみを対象
    if (order.status !== '進行中') {
      return false;
    }

    // 部署でフィルター
    if (selectedDepartment !== 'All' && order.department !== selectedDepartment) {
      return false;
    }

    // 期間でフィルター
    if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) {
      return false;
    }
    if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) {
      return false;
    }

    // ランクでフィルター
    if (!filterRanks.includes(order.rank)) {
      return false;
    }

    // 案件名でフィルター
    if (searchOrderName && !order.name.includes(searchOrderName)) {
      return false;
    }

    return true;
  });

  // ソート
  const rankOrder = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'date-desc':
        return new Date(b.orderDate) - new Date(a.orderDate);
      case 'date-asc':
        return new Date(a.orderDate) - new Date(b.orderDate);
      case 'rank-asc':
        return rankOrder[a.rank] - rankOrder[b.rank];
      case 'rank-desc':
        return rankOrder[b.rank] - rankOrder[a.rank];
      default:
        return 0;
    }
  });

  // 集計計算
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  const rankAOrders = filteredOrders.filter(o => o.rank === 'A');
  const rankAAmount = rankAOrders.reduce((sum, o) => sum + o.amount, 0);
  const rankBOrders = filteredOrders.filter(o => o.rank === 'B');
  const rankBAmount = rankBOrders.reduce((sum, o) => sum + o.amount, 0);
  const rankCOrders = filteredOrders.filter(o => o.rank === 'C');
  const rankCAmount = rankCOrders.reduce((sum, o) => sum + o.amount, 0);
  const rankDOrders = filteredOrders.filter(o => o.rank === 'D');
  const rankDAmount = rankDOrders.reduce((sum, o) => sum + o.amount, 0);
  const rankEOrders = filteredOrders.filter(o => o.rank === 'E');
  const rankEAmount = rankEOrders.reduce((sum, o) => sum + o.amount, 0);

  // ランク別円グラフ用データ
  const rankPieData = [
    { name: 'ランクA', value: rankAAmount, count: rankAOrders.length },
    { name: 'ランクB', value: rankBAmount, count: rankBOrders.length },
    { name: 'ランクC', value: rankCAmount, count: rankCOrders.length },
    { name: 'ランクD', value: rankDAmount, count: rankDOrders.length },
    { name: 'ランクE', value: rankEAmount, count: rankEOrders.length }
  ].filter(item => item.value > 0);

  const RANK_CHART_COLORS = ['#1e40af', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  // 受注済み統計（期間指定フィルター対応）
  const completedOrdersInPeriod = orders
    .filter(order => order.status === '受注済み')
    .filter(order => {
      if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
      if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
      return true;
    });
  const completedAmount = completedOrdersInPeriod.reduce((sum, o) => sum + o.amount, 0);

  // 滞留案件
  const stuckOrders = filteredOrders
    .filter(isStuckOrder)
    .sort((a, b) => b.amount - a.amount);

  // 案件を案件名でグループ化
  const groupOrdersByName = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      if (!grouped[order.name]) {
        grouped[order.name] = [];
      }
      grouped[order.name].push(order);
    });
    return grouped;
  };

  // 月別実績計算
  const getMonthlyData = () => {
    const monthMap = {};
    filteredOrders.forEach(order => {
      const month = order.deliveryMonth;
      monthMap[month] = (monthMap[month] || 0) + order.amount;
    });

    const targetMonths = Array.isArray(monthlyTargets) ? monthlyTargets.map(t => t.month) : [];
    const allMonths = new Set([...Object.keys(monthMap), ...targetMonths]);
    return Array.from(allMonths)
      .sort()
      .map(month => ({
        month,
        実績: monthMap[month] || 0,
        目標: (Array.isArray(monthlyTargets)
          ? monthlyTargets.find(t => t.month === month)?.target
          : 0) || 0
      }));
  };

  const monthlyData = getMonthlyData();

  // スナップショットフィルター
  const getFilteredSnapshots = () => {
    if (snapshots.length === 0) return [];
    const today = new Date();
    let startDate = new Date();

    switch (snapshotPeriod) {
      case '1month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
      default:
        return snapshots.sort((a, b) => a.date.localeCompare(b.date));
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    return snapshots
      .filter(s => s.date >= startDateStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const filteredSnapshots = getFilteredSnapshots();

  // ランク分布
  const rankData = [
    { name: 'A（確実）', value: rankAOrders.length, color: RANK_COLORS.A.dot },
    { name: 'B（見込み高い）', value: rankBOrders.length, color: RANK_COLORS.B.dot },
    { name: 'C（検討中）', value: rankCOrders.length, color: RANK_COLORS.C.dot },
    { name: 'D（課題あり）', value: rankDOrders.length, color: RANK_COLORS.D.dot },
    { name: 'E（その他）', value: rankEOrders.length, color: RANK_COLORS.E.dot }
  ].filter(r => r.value > 0);

  // 当月の実績計算
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthAmount = monthlyData.find(d => d.month === currentMonth)?.実績 || 0;

  // 期間内の実績・目標を計算（受注済み＋進行中）
  const getPeriodStats = (startMonth, endMonth) => {
    const start = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');

    const periodOrders = orders.filter(order => {
      // ステータスが「受注済み」または「進行中」
      if (!['受注済み', '進行中'].includes(order.status)) {
        return false;
      }

      // 部署フィルター
      if (selectedDepartment !== 'All' && order.department !== selectedDepartment) {
        return false;
      }

      // 期間フィルター（納期月）
      const orderMonth = new Date(order.deliveryMonth + '-01');
      return orderMonth >= start && orderMonth <= end;
    });

    const periodTarget = (Array.isArray(monthlyTargets) ? monthlyTargets : [])
      .filter(t => t.month >= startMonth && t.month <= endMonth && (selectedDepartment === 'All' || t.department === selectedDepartment))
      .reduce((sum, t) => sum + t.target, 0);

    const periodActual = periodOrders.reduce((sum, o) => sum + o.amount, 0);

    const rankBreakdown = {
      A: periodOrders.filter(o => o.rank === 'A').reduce((sum, o) => sum + o.amount, 0),
      B: periodOrders.filter(o => o.rank === 'B').reduce((sum, o) => sum + o.amount, 0),
      C: periodOrders.filter(o => o.rank === 'C').reduce((sum, o) => sum + o.amount, 0),
      D: periodOrders.filter(o => o.rank === 'D').reduce((sum, o) => sum + o.amount, 0)
    };

    return {
      target: periodTarget,
      actual: periodActual,
      diff: periodActual - periodTarget,
      rankBreakdown
    };
  };

  const periodStats = getPeriodStats(periodStart, periodEnd);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">受注残管理</h1>
              <p className="text-gray-600 mt-2">企業全体の受注残金額・進捗状況を一元管理</p>
            </div>
            <button
              onClick={() => setShowOrderForm(true)}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg shadow transition"
            >
              <Plus size={20} />
              新規案件
            </button>
          </div>

          {/* フィルター：部署 */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 block mb-2">部署で絞り込み:</span>
            <div className="flex gap-2 flex-wrap">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedDepartment === dept
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* フィルター：案件名検索 */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 block mb-2">案件名で検索:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchOrderName}
                onChange={(e) => setSearchOrderName(e.target.value)}
                placeholder="案件名を入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchOrderName && (
                <button
                  onClick={() => setSearchOrderName('')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg font-medium transition"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          {/* 実績設定期間 */}
          <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
            <span className="text-sm font-medium text-gray-900 block mb-3">📊 実績設定期間（固定）</span>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="text-xs text-gray-600 block mb-1">開始月</label>
                <input
                  type="month"
                  value={tempPeriodStart}
                  onChange={(e) => setTempPeriodStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">終了月</label>
                <input
                  type="month"
                  value={tempPeriodEnd}
                  onChange={(e) => setTempPeriodEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleSetPeriod}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition"
              >
                設定
              </button>
              <span className="text-xs text-gray-600">
                現在: {periodStart} ～ {periodEnd}
              </span>
            </div>
          </div>

          {/* フィルター：期間指定 */}
          <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700 block mb-3">期間指定（納期月）:</span>
            <div className="flex gap-4 items-center flex-wrap">
              <div>
                <label className="text-xs text-gray-600 block mb-1">開始月</label>
                <input
                  type="month"
                  value={filterPeriodStart}
                  onChange={(e) => setFilterPeriodStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">終了月</label>
                <input
                  type="month"
                  value={filterPeriodEnd}
                  onChange={(e) => setFilterPeriodEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setFilterPeriodStart('');
                  setFilterPeriodEnd('');
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg font-medium transition mt-5"
              >
                クリア
              </button>
            </div>
          </div>

          {/* フィルター：ランク選択 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700 block mb-3">ランクで絞り込み:</span>
            <div className="flex gap-3 flex-wrap">
              {['A', 'B', 'C', 'D', 'E'].map(rank => (
                <label key={rank} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterRanks.includes(rank)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilterRanks([...filterRanks, rank]);
                      } else {
                        setFilterRanks(filterRanks.filter(r => r !== rank));
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`px-3 py-1 rounded-full font-bold text-sm ${RANK_COLORS[rank].bg} ${RANK_COLORS[rank].text}`}>
                    {rank}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 受注残推移グラフ */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">受注残推移</h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '1ヶ月', value: '1month' },
                { label: '3ヶ月', value: '3months' },
                { label: '6ヶ月', value: '6months' },
                { label: '1年', value: '1year' },
                { label: '全期間', value: 'all' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSnapshotPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    snapshotPeriod === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {filteredSnapshots.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredSnapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.floor(value / 10000)}M`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="受注残金額"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              スナップショットデータがまだ蓄積されていません
            </div>
          )}
        </div>

        {/* グラフエリア */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* ランク分布 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">ランク分布</h2>
            {rankData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rankData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}件`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rankData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>

          {/* 月別実績 vs 目標 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">月別実績 vs 目標</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Bar dataKey="実績" fill="#3b82f6" />
                  <Line type="monotone" dataKey="目標" stroke="#ef4444" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>
        </div>

        {/* 目標設定テーブル */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">月別目標設定</h2>
            <button
              onClick={() => setShowTargetForm(true)}
              className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
            >
              <Plus size={18} />
              目標を追加
            </button>
          </div>

          {(Array.isArray(monthlyTargets) && monthlyTargets.length > 0) ? (
            <>
              {/* 累積サマリーカード */}
              {(() => {
                let cumulativeTarget = 0;
                let cumulativeActual = 0;

                monthlyTargets.forEach(target => {
                  cumulativeTarget += target.target;
                  const actual = monthlyData.find(d => d.month === target.month)?.実績 || 0;
                  cumulativeActual += actual;
                });

                const cumulativeDiff = cumulativeActual - cumulativeTarget;

                return (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow p-4 text-white">
                      <p className="text-sm font-medium opacity-90">累積目標金額</p>
                      <p className="text-2xl font-bold mt-2">{formatCurrency(cumulativeTarget)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
                      <p className="text-sm font-medium opacity-90">累積実績金額</p>
                      <p className="text-2xl font-bold mt-2">{formatCurrency(cumulativeActual)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow p-4 text-white">
                      <p className="text-sm font-medium opacity-90">累積差分（実績−目標）</p>
                      <p className="text-2xl font-bold mt-2 text-white">{cumulativeDiff >= 0 ? '+' : ''}{formatCurrency(cumulativeDiff)}</p>
                    </div>
                  </div>
                );
              })()}

              {/* テーブル */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">月</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">部署</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">目標金額</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">実績金額</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">差分</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">達成率</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(monthlyTargets) ? monthlyTargets : [])
                      .sort((a, b) => a.month.localeCompare(b.month))
                      .map(targetData => {
                        const actual = monthlyData.find(d => d.month === targetData.month)?.実績 || 0;
                        const diff = actual - targetData.target;
                        const achievementRate = targetData.target > 0 ? Math.round((actual / targetData.target) * 100) : 0;
                        return (
                          <tr key={targetData.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{targetData.month}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{targetData.department}</td>
                            <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrencyFull(targetData.target)}</td>
                            <td className="py-3 px-4 text-right font-medium text-blue-600">{formatCurrencyFull(actual)}</td>
                            <td className="py-3 px-4 text-right font-medium">
                              <span className={diff >= 0 ? 'text-blue-900' : 'text-red-600'}>
                                {diff >= 0 ? '+' : ''}{formatCurrencyFull(diff)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-block px-3 py-1 rounded-full font-medium ${
                                achievementRate >= 100
                                  ? 'bg-blue-50 text-blue-900'
                                  : achievementRate >= 80
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {achievementRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTarget(targetData);
                                    setNewTargetMonth(targetData.month);
                                    setNewTargetDepartment(targetData.department);
                                    setNewTargetAmount(String(targetData.target));
                                    setShowTargetForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="編集"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`${targetData.month} - ${targetData.department} の目標を削除しますか？`)) return;
                                    try {
                                      await deleteTarget(targetData.id);
                                      setMonthlyTargets(prev =>
                                        Array.isArray(prev) ? prev.filter(t => t.id !== targetData.id) : []
                                      );
                                    } catch (error) {
                                      console.error('目標削除エラー:', error);
                                      alert('目標の削除に失敗しました');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="削除"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">目標設定はまだありません</p>
          )}
        </div>

        {/* 見込みvs目標（通期・下期） */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-lg p-8 mb-8 border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 見込みvs目標 ({periodStart} ～ {periodEnd})</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* 通期 */}
            {(() => {
              const completedActual = completedOrdersInPeriod.reduce((sum, o) => sum + o.amount, 0);
              const forecastActual = filteredOrders
                .filter(order => {
                  if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
                  if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
                  return true;
                })
                .reduce((sum, o) => sum + o.amount, 0);
              const totalActual = completedActual + forecastActual;
              const forecastA = filteredOrders.filter(o => o.rank === 'A').filter(order => {
                if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
                if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
                return true;
              }).reduce((sum, o) => sum + o.amount, 0);
              const forecastB = filteredOrders.filter(o => o.rank === 'B').filter(order => {
                if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
                if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
                return true;
              }).reduce((sum, o) => sum + o.amount, 0);
              const forecastC = filteredOrders.filter(o => o.rank === 'C').filter(order => {
                if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
                if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
                return true;
              }).reduce((sum, o) => sum + o.amount, 0);
              const forecastD = filteredOrders.filter(o => o.rank === 'D').filter(order => {
                if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
                if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
                return true;
              }).reduce((sum, o) => sum + o.amount, 0);

              return (
                <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-700 mb-3">通期（{periodStart}～{periodEnd}）</p>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">目標:</span>
                      <span className="font-bold text-black">{formatCurrencyFull(periodStats.target)}</span>
                    </p>
                    <div>
                      <p className="flex justify-between mb-2">
                        <span className="text-gray-600">見込み:</span>
                        <span className="font-bold text-black">{formatCurrencyFull(completedActual + forecastA + forecastB + forecastC + forecastD)}</span>
                      </p>
                      <p className="flex justify-between mb-3 text-xs text-gray-600 border-b pb-2">
                        <span>→ 高確度(実績+AB):</span>
                        <span className="font-semibold text-gray-900">{formatCurrencyFull(completedActual + forecastA + forecastB)}</span>
                      </p>
                      <div className="pl-4 space-y-1 text-xs">
                        <p className="text-gray-600 mb-1">見込み内訳：</p>
                        <p className="flex justify-between"><span>・受注済み(実績):</span> <span className="font-semibold text-blue-900">{formatCurrencyFull(completedActual)}</span></p>
                        <p className="flex justify-between mb-1"><span>・総受注残金額(A-D):</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastA + forecastB + forecastC + forecastD)}</span></p>
                        <div className="ml-4">
                          <p className="flex justify-between text-xs"><span>受注確度高(A+B):</span> <span className="font-semibold text-blue-900">{formatCurrencyFull(forecastA + forecastB)}</span></p>
                          <p className="flex justify-between text-xs"><span>受注確度中・低(C+D):</span> <span className="font-semibold text-amber-600">{formatCurrencyFull(forecastC + forecastD)}</span></p>
                        </div>
                      </div>
                    </div>
                    <p className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">差分:</span>
                      <span className={`font-bold ${totalActual - periodStats.target >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                        {totalActual - periodStats.target >= 0 ? '+' : ''}{formatCurrencyFull(totalActual - periodStats.target)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-2">ランク別見込み:</p>
                    <div className="space-y-1 text-xs">
                      <p className="flex justify-between"><span>A:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastA)}</span></p>
                      <p className="flex justify-between"><span>B:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastB)}</span></p>
                      <p className="flex justify-between"><span>C:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastC)}</span></p>
                      <p className="flex justify-between"><span>D:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastD)}</span></p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 下期 */}
            {(() => {
              const [startYear, startMonth] = periodStart.split('-').map(Number);
              const [endYear, endMonth] = periodEnd.split('-').map(Number);
              const periodMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

              let latterStart = periodStart;
              if (periodMonths > 6) {
                const midMonth = startMonth + Math.floor(periodMonths / 2);
                if (midMonth > 12) {
                  latterStart = `${startYear + 1}-${String(midMonth - 12).padStart(2, '0')}`;
                } else {
                  latterStart = `${startYear}-${String(midMonth).padStart(2, '0')}`;
                }
              }

              const latterStats = getPeriodStats(latterStart, periodEnd);
              const completedActual = completedOrdersInPeriod.filter(order => order.deliveryMonth >= latterStart).reduce((sum, o) => sum + o.amount, 0);
              const forecastActual = filteredOrders.filter(order => order.deliveryMonth >= latterStart && (filterPeriodStart ? order.deliveryMonth >= filterPeriodStart : true) && (filterPeriodEnd ? order.deliveryMonth <= filterPeriodEnd : true)).reduce((sum, o) => sum + o.amount, 0);
              const totalActual = completedActual + forecastActual;
              const forecastA = filteredOrders.filter(o => o.rank === 'A' && o.deliveryMonth >= latterStart && (filterPeriodStart ? o.deliveryMonth >= filterPeriodStart : true) && (filterPeriodEnd ? o.deliveryMonth <= filterPeriodEnd : true)).reduce((sum, o) => sum + o.amount, 0);
              const forecastB = filteredOrders.filter(o => o.rank === 'B' && o.deliveryMonth >= latterStart && (filterPeriodStart ? o.deliveryMonth >= filterPeriodStart : true) && (filterPeriodEnd ? o.deliveryMonth <= filterPeriodEnd : true)).reduce((sum, o) => sum + o.amount, 0);
              const forecastC = filteredOrders.filter(o => o.rank === 'C' && o.deliveryMonth >= latterStart && (filterPeriodStart ? o.deliveryMonth >= filterPeriodStart : true) && (filterPeriodEnd ? o.deliveryMonth <= filterPeriodEnd : true)).reduce((sum, o) => sum + o.amount, 0);
              const forecastD = filteredOrders.filter(o => o.rank === 'D' && o.deliveryMonth >= latterStart && (filterPeriodStart ? o.deliveryMonth >= filterPeriodStart : true) && (filterPeriodEnd ? o.deliveryMonth <= filterPeriodEnd : true)).reduce((sum, o) => sum + o.amount, 0);

              return (
                <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-700 mb-3">下期（{latterStart}～{periodEnd}）</p>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">目標:</span>
                      <span className="font-bold text-orange-600">{formatCurrencyFull(latterStats.target)}</span>
                    </p>
                    <div>
                      <p className="flex justify-between mb-2">
                        <span className="text-gray-600">見込み:</span>
                        <span className="font-bold text-black">{formatCurrencyFull(completedActual + forecastA + forecastB + forecastC + forecastD)}</span>
                      </p>
                      <p className="flex justify-between mb-3 text-xs text-gray-600 border-b pb-2">
                        <span>→ 高確度(実績+AB):</span>
                        <span className="font-semibold text-gray-900">{formatCurrencyFull(completedActual + forecastA + forecastB)}</span>
                      </p>
                      <div className="pl-4 space-y-1 text-xs">
                        <p className="text-gray-600 mb-1">見込み内訳：</p>
                        <p className="flex justify-between"><span>・受注済み(実績):</span> <span className="font-semibold text-blue-900">{formatCurrencyFull(completedActual)}</span></p>
                        <p className="flex justify-between mb-1"><span>・総受注残金額(A-D):</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastA + forecastB + forecastC + forecastD)}</span></p>
                        <div className="ml-4">
                          <p className="flex justify-between text-xs"><span>受注確度高(A+B):</span> <span className="font-semibold text-blue-900">{formatCurrencyFull(forecastA + forecastB)}</span></p>
                          <p className="flex justify-between text-xs"><span>受注確度中・低(C+D):</span> <span className="font-semibold text-amber-600">{formatCurrencyFull(forecastC + forecastD)}</span></p>
                        </div>
                      </div>
                    </div>
                    <p className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">差分:</span>
                      <span className={`font-bold ${totalActual - latterStats.target >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                        {totalActual - latterStats.target >= 0 ? '+' : ''}{formatCurrencyFull(totalActual - latterStats.target)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-2">ランク別見込み:</p>
                    <div className="space-y-1 text-xs">
                      <p className="flex justify-between"><span>A:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastA)}</span></p>
                      <p className="flex justify-between"><span>B:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastB)}</span></p>
                      <p className="flex justify-between"><span>C:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastC)}</span></p>
                      <p className="flex justify-between"><span>D:</span> <span className="font-semibold text-black">{formatCurrencyFull(forecastD)}</span></p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {[
            {
              label: '受注済み',
              value: formatCurrency(completedAmount),
              icon: TrendingUp,
              color: 'from-blue-500 to-blue-600'
            },
            {
              label: 'ランクAB（高確度）',
              value: `${rankAOrders.length + rankBOrders.length}件 / ${formatCurrency(rankAAmount + rankBOrders.reduce((sum, o) => sum + o.amount, 0))}`,
              icon: TrendingUp,
              color: 'from-blue-900 to-blue-800'
            },
            {
              label: '受注残(受注確度中・低)',
              value: formatCurrency(rankCOrders.reduce((sum, o) => sum + o.amount, 0) + rankDOrders.reduce((sum, o) => sum + o.amount, 0)),
              icon: DollarSign,
              color: 'from-amber-500 to-amber-600'
            },
            {
              label: `当月納期予定`,
              value: formatCurrency(currentMonthAmount),
              icon: Calendar,
              color: 'from-gray-500 to-gray-600'
            },
            {
              label: '滞留案件',
              value: `${stuckOrders.length}件`,
              icon: AlertTriangle,
              color: 'from-red-500 to-red-600',
              alert: stuckOrders.length > 0
            }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`bg-gradient-to-br ${card.color} rounded-lg shadow-lg p-6 text-white ${
                  card.alert ? 'ring-2 ring-red-300' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium opacity-90">{card.label}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                  </div>
                  <Icon size={24} className="opacity-75" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 案件一覧テーブル */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">案件一覧</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">ソート:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="amount-desc">金額（高い順）</option>
                <option value="amount-asc">金額（低い順）</option>
                <option value="date-desc">受注日（新しい順）</option>
                <option value="date-asc">受注日（古い順）</option>
                <option value="rank-asc">ランク（A→E）</option>
                <option value="rank-desc">ランク（E→A）</option>
              </select>
            </div>
          </div>

          {sortedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 w-12">No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">案件名</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">顧客</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">金額</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">ランク</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">部署</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">納期月</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">備考</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groupedOrders = groupOrdersByName(sortedOrders);
                    const groupNames = Object.keys(groupedOrders).sort((a, b) => {
                      const aItems = groupedOrders[a];
                      const bItems = groupedOrders[b];
                      const aTotalAmount = aItems.reduce((sum, o) => sum + o.amount, 0);
                      const bTotalAmount = bItems.reduce((sum, o) => sum + o.amount, 0);

                      switch (sortBy) {
                        case 'amount-desc':
                          return bTotalAmount - aTotalAmount;
                        case 'amount-asc':
                          return aTotalAmount - bTotalAmount;
                        case 'date-desc':
                          return new Date(bItems[0].orderDate) - new Date(aItems[0].orderDate);
                        case 'date-asc':
                          return new Date(aItems[0].orderDate) - new Date(bItems[0].orderDate);
                        case 'rank-asc':
                          return rankOrder[aItems[0].rank] - rankOrder[bItems[0].rank];
                        case 'rank-desc':
                          return rankOrder[bItems[0].rank] - rankOrder[aItems[0].rank];
                        default:
                          return 0;
                      }
                    });
                    let rowNumber = 1;

                    return groupNames.flatMap((groupName, groupIndex) => {
                      const groupItems = groupedOrders[groupName];
                      const isMultiple = groupItems.length > 1;
                      const isExpanded = isMultiple && expandedGroups[groupName] === true; // 複数件のみ展開可能、デフォルトで非表示

                      // 1件のみの場合はグループ化しない
                      if (!isMultiple) {
                        const order = groupItems[0];
                        return (
                          <tr
                            key={order.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-center font-medium text-gray-700 w-12">
                              {rowNumber++}
                            </td>
                            <td className="py-3 px-4 text-gray-900 font-medium">
                              <span>{groupName}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <span className="text-sm">{order.customer}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                              {formatCurrencyFull(order.amount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${RANK_COLORS[order.rank].bg} ${RANK_COLORS[order.rank].text}`}>
                                {order.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-sm text-gray-600">{order.department}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-sm text-gray-600">{order.deliveryMonth}</span>
                            </td>
                            <td className="py-3 px-4 text-left">
                              <span className="text-sm text-gray-600 line-clamp-3 max-w-xs">{order.remarks || '-'}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingOrder(order);
                                    setShowOrderForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="編集"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleCopyOrder(order)}
                                  className="text-blue-900 hover:text-blue-700"
                                  title="コピー"
                                >
                                  <Copy size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="削除"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // 複数件の場合はグループ行と個別行を表示
                      const totalAmount = groupItems.reduce((sum, o) => sum + o.amount, 0);
                      const groupStartNumber = rowNumber;
                      rowNumber += groupItems.length;

                      const rows = [
                        // グループ行
                        <tr
                          key={`group-${groupName}`}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 border-b-2 border-blue-300 cursor-pointer"
                          onClick={() => {
                            setExpandedGroups(prev => ({
                              ...prev,
                              [groupName]: !prev[groupName]
                            }));
                          }}
                        >
                          <td className="py-4 px-4 text-center font-bold text-gray-900 w-12">
                            {groupStartNumber}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg text-gray-700">
                                {isExpanded ? (
                                  <ChevronDown size={20} className="inline text-blue-600" />
                                ) : (
                                  <ChevronRight size={20} className="inline text-blue-600" />
                                )}
                              </span>
                              <span className="font-bold text-gray-900 text-lg">{groupName}</span>
                              <span className="text-sm font-semibold bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
                                ({groupItems.length}件)
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4 text-right font-bold text-blue-700">
                            {formatCurrencyFull(totalAmount)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      ];

                      // 個別案件行（展開時のみ表示）
                      if (isExpanded) {
                        groupItems.forEach((order, index) => {
                          rows.push(
                            <tr
                              key={order.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-center text-gray-500 pl-12">
                                <span className="text-xs">└</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-700"></span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <span className="text-sm">{order.customer}</span>
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-gray-700">
                                {formatCurrencyFull(order.amount)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${RANK_COLORS[order.rank].bg} ${RANK_COLORS[order.rank].text}`}>
                                  {order.rank}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm text-gray-600">{order.department}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm text-gray-600">{order.deliveryMonth}</span>
                              </td>
                              <td className="py-3 px-4 text-left">
                                <span className="text-sm text-gray-600 line-clamp-3 max-w-xs">{order.remarks || '-'}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingOrder(order);
                                      setShowOrderForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="編集"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleCopyOrder(order)}
                                    className="text-blue-900 hover:text-blue-700"
                                    title="コピー"
                                  >
                                    <Copy size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="削除"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      }

                      return rows;
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">案件がありません</p>
          )}
        </div>

        {/* 完了案件一覧 */}
        {(() => {
          const completedOrders = orders
            .filter(order => order.status === '受注済み')
            .filter(order => {
              if (filterPeriodStart && order.deliveryMonth < filterPeriodStart) return false;
              if (filterPeriodEnd && order.deliveryMonth > filterPeriodEnd) return false;
              return true;
            })
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

          return completedOrders.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-blue-900" size={24} />
                  <h2 className="text-lg font-bold text-blue-900">完了案件一覧</h2>
                </div>
                {completedOrders.length > 5 && (
                  <button
                    onClick={() => setExpandCompletedOrders(!expandCompletedOrders)}
                    className="text-sm text-blue-900 hover:text-blue-700 font-medium"
                  >
                    {expandCompletedOrders ? 'すべて閉じる' : `すべて表示（${completedOrders.length}件）`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-center py-3 px-4 font-semibold text-blue-900 w-12">No.</th>
                      <th className="text-left py-3 px-4 font-semibold text-blue-900">案件名</th>
                      <th className="text-left py-3 px-4 font-semibold text-blue-900">顧客</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-900">金額</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-900">ランク</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-900">部署</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-900">納期月</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-900">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expandCompletedOrders ? completedOrders : completedOrders.slice(0, 5)).map((order, index) => (
                      <tr key={order.id} className="border-b border-blue-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-center text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{order.name}</td>
                        <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-900">{formatCurrencyFull(order.amount)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold ${RANK_COLORS[order.rank].bg} ${RANK_COLORS[order.rank].text}`}>
                            {order.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{order.department}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{order.deliveryMonth}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                                setShowOrderForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="編集"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600 hover:text-red-800"
                              title="削除"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!expandCompletedOrders && completedOrders.length > 5 && (
                  <div className="text-center py-2 text-xs text-blue-900">
                    残り {completedOrders.length - 5} 件
                  </div>
                )}
              </div>
            </div>
          ) : null
        })()}

        {/* ランク別分析 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">ランク別分析</h2>

          {/* ランク別売上KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { rank: 'A', amount: rankAAmount, count: rankAOrders.length, color: 'from-blue-500 to-blue-600' },
              { rank: 'B', amount: rankBAmount, count: rankBOrders.length, color: 'from-blue-400 to-blue-500' },
              { rank: 'C', amount: rankCAmount, count: rankCOrders.length, color: 'from-amber-500 to-amber-600' },
              { rank: 'D', amount: rankDAmount, count: rankDOrders.length, color: 'from-red-500 to-red-600' },
              { rank: 'E', amount: rankEAmount, count: rankEOrders.length, color: 'from-gray-500 to-gray-600' }
            ].map(item => (
              <div key={item.rank} className={`bg-gradient-to-br ${item.color} rounded-lg p-4 text-white`}>
                <p className="text-sm font-medium opacity-90">ランク{item.rank}</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(item.amount)}</p>
                <p className="text-xs opacity-75 mt-1">{item.count}件</p>
              </div>
            ))}
          </div>

          {/* ランク別円グラフ */}
          {rankPieData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">売上構成</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rankPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = rankPieData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      return `${name}: ${Math.floor(value / 10000)}万円 (${percentage}%)`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rankPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RANK_CHART_COLORS[index % RANK_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 滞留案件 */}
        {stuckOrders.length > 0 && (
          <div className="bg-gray-50 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-lg font-bold text-red-700">滞留案件一覧（注意が必要）</h2>
            </div>
            <p className="text-sm text-red-600 mb-4">受注日から3ヶ月以上経過し、ランクB/C/Dの案件</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-red-200">
                    <th className="text-center py-3 px-4 font-semibold text-red-700 w-12">No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-red-700">案件名</th>
                    <th className="text-left py-3 px-4 font-semibold text-red-700">顧客</th>
                    <th className="text-right py-3 px-4 font-semibold text-red-700">金額</th>
                    <th className="text-center py-3 px-4 font-semibold text-red-700">ランク</th>
                    <th className="text-center py-3 px-4 font-semibold text-red-700">受注日</th>
                    <th className="text-center py-3 px-4 font-semibold text-red-700">経過月数</th>
                  </tr>
                </thead>
                <tbody>
                  {stuckOrders.map((order, index) => (
                    <tr key={order.id} className="border-b border-red-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-center text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{order.name}</td>
                      <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-700">{formatCurrencyFull(order.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-bold ${RANK_COLORS[order.rank].bg} ${RANK_COLORS[order.rank].text}`}>
                          {order.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{order.orderDate}</td>
                      <td className="py-3 px-4 text-center font-semibold text-red-700">
                        {getMonthsAgo(order.orderDate)}ヶ月
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 失注案件一覧 */}
        {(() => {
          const lossOrders = orders.filter(order => order.status === '失注').sort((a, b) => new Date(b.lossDate) - new Date(a.lossDate));
          return lossOrders.length > 0 ? (
            <div className="bg-gray-50 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={24} />
                  <h2 className="text-lg font-bold text-red-700">失注案件一覧</h2>
                </div>
                {lossOrders.length > 5 && (
                  <button
                    onClick={() => setExpandLossOrders(!expandLossOrders)}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    {expandLossOrders ? 'すべて閉じる' : `すべて表示（${lossOrders.length}件）`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-red-200">
                      <th className="text-left py-3 px-4 font-semibold text-orange-700">案件名</th>
                      <th className="text-left py-3 px-4 font-semibold text-orange-700">顧客</th>
                      <th className="text-right py-3 px-4 font-semibold text-orange-700">金額</th>
                      <th className="text-center py-3 px-4 font-semibold text-orange-700">失注日</th>
                      <th className="text-left py-3 px-4 font-semibold text-orange-700">失注理由</th>
                      <th className="text-center py-3 px-4 font-semibold text-orange-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expandLossOrders ? lossOrders : lossOrders.slice(0, 5)).map(order => (
                      <tr key={order.id} className="border-b border-red-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{order.name}</td>
                        <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                        <td className="py-3 px-4 text-right font-bold text-orange-700">{formatCurrencyFull(order.amount)}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{order.lossDate}</td>
                        <td className="py-3 px-4 text-gray-600">{order.lossReason}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                                setShowOrderForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="編集"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600 hover:text-red-800"
                              title="削除"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!expandLossOrders && lossOrders.length > 5 && (
                  <div className="text-center py-2 text-xs text-orange-600">
                    残り {lossOrders.length - 5} 件
                  </div>
                )}
              </div>
            </div>
          ) : null
        })()}

        {/* 変更履歴 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">変更履歴</h2>
            {activityLog.length > 3 && (
              <button
                onClick={() => setExpandActivityLog(!expandActivityLog)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandActivityLog ? 'すべて閉じる' : `すべて表示（${activityLog.length}件）`}
              </button>
            )}
          </div>
          {activityLog.length > 0 ? (
            <div className="space-y-3">
              {(expandActivityLog ? activityLog : activityLog.slice(0, 3)).map(log => (
                <div key={log.id} className="flex items-start gap-3 py-3 px-4 bg-gray-50 rounded-lg border-l-4" style={{
                  borderLeftColor: log.type === 'add' ? '#10b981' : log.type === 'edit' ? '#3b82f6' : '#ef4444'
                }}>
                  <div className="text-xs font-medium text-gray-500 min-w-fit whitespace-nowrap">{log.timestamp}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 break-words">{log.message}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                    log.type === 'add' ? 'bg-blue-50 text-blue-900' :
                    log.type === 'edit' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {log.type === 'add' ? '追加' : log.type === 'edit' ? '編集' : '削除'}
                  </span>
                </div>
              ))}
              {!expandActivityLog && activityLog.length > 3 && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">残り {activityLog.length - 3} 件</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">変更履歴はありません</p>
          )}
        </div>
      </div>

      {/* 案件フォーム */}
      {showOrderForm && (
        <OrderForm
          order={editingOrder}
          onSave={handleSaveOrder}
          onCancel={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* 目標設定フォーム */}
      {showTargetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingTarget ? '目標を編集' : '月別目標を追加'}</h2>
              <button
                onClick={() => {
                  setShowTargetForm(false);
                  setEditingTarget(null);
                  setNewTargetMonth('');
                  setNewTargetDepartment('オープン１課');
                  setNewTargetAmount('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">月 *</label>
                <input
                  type="month"
                  value={newTargetMonth}
                  onChange={(e) => setNewTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">部署 *</label>
                <select
                  value={newTargetDepartment}
                  onChange={(e) => setNewTargetDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {DEPARTMENTS.filter(d => d !== 'All').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">目標金額 *</label>
                <input
                  type="number"
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="10000000"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveTarget}
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                追加
              </button>
              <button
                onClick={() => setShowTargetForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderBacklogApp;
