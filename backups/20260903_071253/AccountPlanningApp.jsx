import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, DollarSign, TrendingUp, Target, Copy
} from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAccountCategories, saveAccountCategory, deleteAccountCategory, fetchAccounts, saveAccount, deleteAccount, fetchAccountTarget, saveAccountTarget, fetchCategoryTargets, saveCategoryTarget } from './api';

const INITIAL_CATEGORIES = ['営業', '企画', 'サポート'];

function formatCurrency(value) {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : (Number(value) || 0);
  const result = `${Math.floor(numValue / 10000)}万円`;
  console.log('formatCurrency入力:', value, '→ numValue:', numValue, '→ 結果:', result);
  return result;
}

function formatCurrencyFull(value) {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : (Number(value) || 0);
  return `${Math.floor(numValue / 10000).toLocaleString('ja-JP')}万円`;
}

function CategoryForm({ onSave, onCancel }) {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert('カテゴリー名を入力してください');
      return;
    }
    onSave(categoryName);
    setCategoryName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">新規カテゴリー追加</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー名 *</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="営業"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              追加
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

function AccountForm({ account, categories, onSave, onCancel }) {
  const getInitialFormData = () => {
    if (account) {
      // 編集時：account フィールドをフォーム用に変換
      const categoryName = categories.find(c => c.id === account.categoryId)?.name || '';
      return {
        customerName: account.customerName || '',
        contactPerson: account.assignee || '',
        category: categoryName,
        approachDate: account.approachDate || '',
        actionPlan: account.actionPlan || '',
        amount: account.expectedAmount !== undefined && account.expectedAmount !== null ? account.expectedAmount : '',
        status: account.status || '進行中'
      };
    } else {
      // 新規時：デフォルト値
      return {
        customerName: '',
        contactPerson: '',
        category: categories.length > 0 ? categories[0].name : '',
        approachDate: '',
        actionPlan: '',
        amount: '',
        status: '進行中'
      };
    }
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [showNewCategory, setShowNewCategory] = useState(false);

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
    console.log('フォーム送信前のformData:', formData);
    if (!formData.customerName || !formData.contactPerson || !formData.category || !formData.approachDate || formData.amount === '' || !formData.status) {
      alert('すべての項目を入力してください');
      return;
    }
    console.log('フォーム送信：', formData);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{account ? 'アカウント編集' : 'アカウント追加'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">顧客名 *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="A社"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当者 *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="山田太郎"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">選択してください</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="__new__">+ 新規カテゴリー追加</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">アプローチ予定日 *</label>
              <input
                type="date"
                name="approachDate"
                value={formData.approachDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">見込み金額（万円） *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="amount"
                step="0.1"
                value={formData.amount === '' ? '' : formData.amount / 10000}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="100"
              />
              <span className="text-sm text-gray-600 font-medium">万円</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">アクションプラン</label>
            <textarea
              name="actionPlan"
              value={formData.actionPlan}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="営業活動の具体的な内容を記入してください"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="進行中">進行中</option>
              <option value="NG">NG</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {account ? '更新' : '追加'}
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

function AccountPlanningApp() {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [targetAmount, setTargetAmount] = useState(500000000); // デフォルト 50,000万円
  const [categoryTargets, setCategoryTargets] = useState({}); // カテゴリー別目標: { categoryId: amount }
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('amount-desc');
  const [tempTargetAmount, setTempTargetAmount] = useState(targetAmount / 10000);
  const [editingCategoryTarget, setEditingCategoryTarget] = useState(null);
  const [memos, setMemos] = useState({});

  // メモを取得（selectedCategory に基づいて）
  const getMemoKey = () => `accountPlanningMemo_${selectedCategory}`;
  const memo = memos[selectedCategory] || localStorage.getItem(getMemoKey()) || '';

  // メモを更新
  const handleMemoChange = (value) => {
    setMemos(prev => ({...prev, [selectedCategory]: value}));
    localStorage.setItem(getMemoKey(), value);
  };

  // API からデータを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await fetchAccountCategories();
        const accountsData = await fetchAccounts();
        const targetData = await fetchAccountTarget();
        const categoryTargetsData = await fetchCategoryTargets();

        // カテゴリーは ID と name を両方保持
        let sortedCategories = Array.isArray(categoriesData) ? categoriesData : [];
        // カテゴリー順序を固定: 大手コンサル・メガSIer → 既存ロイヤルカスタマー → MG/MRAG → エンドユーザー → その他
        const categoryOrder = ['大手コンサル・メガSIer', '既存ロイヤルカスタマー', 'MG/MRAG', 'エンドユーザー', 'その他'];
        sortedCategories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name);
          const indexB = categoryOrder.indexOf(b.name);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        setCategories(sortedCategories);
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        if (targetData && targetData.targetAmount) {
          setTargetAmount(targetData.targetAmount);
          setTempTargetAmount(targetData.targetAmount / 10000);
        }
        // カテゴリー別目標を辞書形式で保存
        const targetsMap = {};
        if (Array.isArray(categoryTargetsData)) {
          categoryTargetsData.forEach(target => {
            targetsMap[target.categoryId] = target.targetAmount;
          });
        }
        setCategoryTargets(targetsMap);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setCategories([]);
      }
    };

    loadData();
  }, []);

  // アカウントを保存（API経由）
  const handleSaveAccount = async (formData) => {
    try {
      // フォームデータをサーバー形式に変換
      const categoryId = categories.find(c => c.name === formData.category)?.id;

      const newAccount = {
        id: editingAccount ? editingAccount.id : Date.now().toString(),
        customerName: formData.customerName,
        categoryId: categoryId,
        assignee: formData.contactPerson,
        approachDate: formData.approachDate,
        actionPlan: formData.actionPlan,
        expectedAmount: parseInt(formData.amount) || 0,
        status: formData.status || '進行中'
      };

      console.log('送信するデータ:', newAccount);

      await saveAccount(newAccount);

      // 保存後、最新のアカウントリストを取得して表示
      const updatedAccounts = await fetchAccounts();
      console.log('取得したアカウント:', updatedAccounts);
      setAccounts(Array.isArray(updatedAccounts) ? updatedAccounts : []);

      setShowAccountForm(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('アカウント保存エラー:', error);
      alert('アカウントの保存に失敗しました');
    }
  };

  // アカウントをコピー
  const handleCopyAccount = async (account) => {
    try {
      const copiedAccount = { ...account, id: Date.now().toString() };
      await saveAccount(copiedAccount);
      setAccounts([...accounts, copiedAccount]);
    } catch (error) {
      console.error('アカウント複製失敗:', error);
      alert('複製に失敗しました');
    }
  };

  // アカウントを削除（API経由）
  const handleDeleteAccount = async (id) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    if (!window.confirm(`「${account.customerName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await deleteAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      alert('アカウントの削除に失敗しました');
    }
  };

  // カテゴリー目標を保存
  const handleSaveCategoryTarget = async (categoryId, targetAmount) => {
    try {
      await saveCategoryTarget(categoryId, targetAmount);
      // 目標を更新
      setCategoryTargets(prev => ({
        ...prev,
        [categoryId]: parseInt(targetAmount) || 0
      }));
      setEditingCategoryTarget(null);
    } catch (error) {
      console.error('カテゴリー目標保存エラー:', error);
      alert('目標金額の保存に失敗しました');
    }
  };

  // カテゴリーを追加（API経由）
  const handleAddCategory = async (categoryName) => {
    try {
      await saveAccountCategory(categoryName);
      // カテゴリーを再度取得して更新
      const updatedCategories = await fetchAccountCategories();
      setCategories(updatedCategories);
      setShowCategoryForm(false);
    } catch (error) {
      console.error('カテゴリー追加エラー:', error);
      alert('カテゴリーの追加に失敗しました');
    }
  };

  // 目標金額を設定（API経由）
  const handleSetTarget = async () => {
    const newTarget = tempTargetAmount * 10000;
    try {
      await saveAccountTarget('target-amount', newTarget);
      setTargetAmount(newTarget);
    } catch (error) {
      console.error('目標金額設定エラー:', error);
      alert('目標金額の設定に失敗しました');
    }
  };

  // フィルタリング
  const filteredAccounts = accounts.filter(account => {
    // NG案件は除外
    if (account.status === 'NG') {
      return false;
    }
    if (selectedCategory !== 'All') {
      const selectedCategoryId = categories.find(c => c.name === selectedCategory)?.id;
      if (account.categoryId !== selectedCategoryId) {
        return false;
      }
    }
    return true;
  });
  console.log('filteredAccounts.length:', filteredAccounts.length, 'sortBy:', sortBy);

  // ソート
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    console.log('sortBy:', sortBy, 'a.expectedAmount:', a.expectedAmount, 'b.expectedAmount:', b.expectedAmount);
    switch (sortBy) {
      case 'amount-desc':
        return b.expectedAmount - a.expectedAmount;
      case 'amount-asc':
        return a.expectedAmount - b.expectedAmount;
      case 'date-desc':
        return new Date(b.approachDate) - new Date(a.approachDate);
      case 'date-asc':
        return new Date(a.approachDate) - new Date(b.approachDate);
      default:
        return 0;
    }
  });

  // 集計計算
  const totalAmount = filteredAccounts.reduce((sum, a) => sum + a.expectedAmount, 0);

  // カテゴリー別の目標金額を取得
  let displayTargetAmount = targetAmount;
  if (selectedCategory !== 'All') {
    const selectedCategoryId = categories.find(c => c.name === selectedCategory)?.id;
    displayTargetAmount = categoryTargets[selectedCategoryId] || 0;
  }

  const progressRate = displayTargetAmount > 0 ? Math.round((totalAmount / displayTargetAmount) * 100) : 0;

  // カテゴリー別サマリー
  const categorySummary = categories.map(cat => {
    const categoryAccounts = accounts.filter(a => a.categoryId === cat.id);
    const categoryTotal = categoryAccounts.reduce((sum, a) => sum + a.expectedAmount, 0);
    const categoryTargetAmount = categoryTargets[cat.id] || 0;
    const categoryProgress = categoryTargetAmount > 0 ? Math.round((categoryTotal / categoryTargetAmount) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      total: categoryTotal,
      count: categoryAccounts.length,
      progress: categoryProgress
    };
  });

  const CATEGORY_COLORS = {
    '大手コンサル・メガSIer': 'from-blue-500 to-blue-600',
    '既存ロイヤルカスタマー': 'from-blue-500 to-blue-600',
    'MG/MRAG': 'from-green-500 to-green-600',
    'エンドユーザー': 'from-pink-500 to-pink-600',
    'その他': 'from-gray-500 to-gray-600'
  };

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || 'from-indigo-500 to-indigo-600';
  };

  // 円グラフ用データを計算
  const pieChartData = categories.map(cat => ({
    name: cat.name,
    value: categoryTargets[cat.id] || 0,
    id: cat.id
  })).filter(item => item.value > 0);

  const CHART_COLORS = ['#3B82F6', '#A855F7', '#10B981', '#EC4899', '#6B7280'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">アカウントプラン管理</h1>
              <p className="text-gray-600 mt-2">ターゲット企業の営業活動を効率的に管理</p>
            </div>
            <button
              onClick={() => setShowAccountForm(true)}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg shadow transition"
            >
              <Plus size={20} />
              新規登録
            </button>
          </div>

          {/* 目標金額設定 */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-50 p-4 rounded-lg border-2 border-orange-200 mb-6">
            <span className="text-sm font-medium text-gray-900 block mb-3">🎯 目標金額設定</span>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="text-xs text-gray-600 block mb-1">目標金額（万円）</label>
                <input
                  type="number"
                  value={tempTargetAmount}
                  onChange={(e) => setTempTargetAmount(parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="50000"
                />
              </div>
              <button
                onClick={handleSetTarget}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg font-medium transition"
              >
                設定
              </button>
              <span className="text-xs text-gray-600">
                現在: {formatCurrency(targetAmount)}
              </span>
            </div>
          </div>

          {/* 円グラフ：カテゴリー別目標構成 */}
          {pieChartData.length > 0 && (() => {
            const totalCategoryTarget = pieChartData.reduce((sum, item) => sum + item.value, 0);
            return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">目標金額の構成</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const percentage = totalCategoryTarget > 0 ? Math.round((value / totalCategoryTarget) * 100) : 0;
                      return `${name}: ${Math.floor(value / 10000)}万円 (${percentage}%)`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.floor(value / 10000)}万円`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">合計: <span className="text-lg font-bold text-gray-900">{Math.floor(totalCategoryTarget / 10000)}万円</span></p>
              </div>
            </div>
            );
          })()}

          {/* カテゴリーフィルター */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 block mb-2">カテゴリーで絞り込み:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                すべて
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-90">見込み金額合計</p>
                <p className="text-3xl font-bold mt-2">{`${(totalAmount / 10000).toLocaleString('ja-JP', {minimumFractionDigits: 1, maximumFractionDigits: 1})}万円`}</p>
              </div>
              <DollarSign size={28} className="opacity-75" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-90">目標金額</p>
                <p className="text-3xl font-bold mt-2">{`${(displayTargetAmount / 10000).toLocaleString('ja-JP', {minimumFractionDigits: 1, maximumFractionDigits: 1})}万円`}</p>
              </div>
              <Target size={28} className="opacity-75" />
            </div>
            {selectedCategory === 'All' ? (
              <div className="mt-4 bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs font-medium opacity-90 mb-2">全体目標を編集</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tempTargetAmount}
                    onChange={(e) => setTempTargetAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 rounded text-sm text-gray-900"
                    placeholder="0"
                  />
                  <button
                    onClick={handleSetTarget}
                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs font-medium opacity-90 mb-2">カテゴリー目標を編集</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingCategoryTarget?.value || Math.floor(displayTargetAmount / 10000)}
                    onChange={(e) => setEditingCategoryTarget({id: categories.find(c => c.name === selectedCategory)?.id, value: e.target.value})}
                    className="flex-1 px-2 py-1 rounded text-sm text-gray-900"
                    placeholder="0"
                  />
                  <button
                    onClick={() => {
                      const categoryId = categories.find(c => c.name === selectedCategory)?.id;
                      handleSaveCategoryTarget(categoryId, parseInt(editingCategoryTarget?.value || displayTargetAmount / 10000 || 0) * 10000);
                    }}
                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`bg-gradient-to-br ${progressRate >= 100 ? 'from-green-500 to-green-600' : 'from-amber-500 to-amber-600'} rounded-lg shadow-lg p-6 text-white`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-90">進捗率</p>
                <p className="text-3xl font-bold mt-2">{progressRate}%</p>
              </div>
              <TrendingUp size={28} className="opacity-75" />
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${Math.min(progressRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* メモ欄 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            メモ {selectedCategory !== 'All' && `（${selectedCategory}）`}
          </h3>
          <textarea
            value={memo}
            onChange={(e) => handleMemoChange(e.target.value)}
            placeholder="ここにメモを入力してください..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows="12"
          />
        </div>

        {/* カテゴリー別サマリー */}
        {selectedCategory === 'All' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categorySummary.map(summary => (
              <div
                key={summary.id}
                className={`bg-gradient-to-br ${getCategoryColor(summary.name)} rounded-lg shadow-lg p-6 text-white`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium opacity-90">{summary.name}</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.total)}</p>
                    <p className="text-xs opacity-75 mt-1">{summary.count}社</p>
                  </div>
                </div>

                {/* 目標金額設定 */}
                <div className="mt-4 bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-xs font-medium opacity-90 mb-2">目標</p>
                  {editingCategoryTarget?.id === summary.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editingCategoryTarget.value}
                        onChange={(e) => setEditingCategoryTarget({id: summary.id, value: e.target.value})}
                        className="flex-1 px-2 py-1 rounded text-sm text-gray-900"
                        placeholder="0"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          handleSaveCategoryTarget(summary.id, parseInt(editingCategoryTarget.value || 0) * 10000);
                        }}
                        className="px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium"
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">{formatCurrency(categoryTargets[summary.id] || 0)}</span>
                      <button
                        onClick={() => setEditingCategoryTarget({id: summary.id, value: ''})}
                        className="text-xs px-2 py-1 bg-white bg-opacity-10 hover:bg-opacity-20 rounded"
                      >
                        編集
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium opacity-90">進捗率</span>
                    <span className="text-sm font-bold">{summary.progress}%</span>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${Math.min(summary.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* アカウント一覧テーブル */}
        <div className="h-20"></div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">ターゲット企業一覧</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">ソート:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    console.log('ドロップダウン変更:', e.target.value);
                    setSortBy(e.target.value);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="amount-desc">金額（高い順）</option>
                  <option value="amount-asc">金額（低い順）</option>
                  <option value="date-desc">日付（新しい順）</option>
                  <option value="date-asc">日付（古い順）</option>
                </select>
              </div>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium py-2 px-4 rounded-lg transition"
              >
                <Plus size={18} />
                カテゴリー追加
              </button>
            </div>
          </div>

          {sortedAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-center py-3 px-4 font-semibold text-gray-700" style={{width: '50px'}}>№</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">顧客名</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">担当者</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">カテゴリー</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">見込み金額</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">アプローチ予定日</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">アクションプラン</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAccounts.map((account, index) => {
                    const categoryName = categories.find(c => c.id === account.categoryId)?.name || '';
                    return (
                    <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-center font-medium text-gray-500" style={{width: '50px'}}>{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{account.customerName}</td>
                      <td className="py-3 px-4 text-gray-600">{account.assignee}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-medium text-xs bg-gradient-to-r ${getCategoryColor(categoryName)} text-white`}>
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {formatCurrencyFull(account.expectedAmount)}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 text-sm">
                        {account.approachDate}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                        {account.actionPlan || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingAccount(account);
                              setShowAccountForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="編集"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleCopyAccount(account)}
                            className="text-blue-900 hover:text-blue-700"
                            title="コピー"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
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
          ) : (
            <p className="text-gray-500 text-center py-8">ターゲット企業がありません</p>
          )}
        </div>

        {/* NG一覧 */}
        <div className="bg-gray-50 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-red-700">NG一覧</h2>
            </div>
          </div>
          {(() => {
            const ngAccounts = accounts.filter(account => account.status === 'NG').sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            return ngAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">顧客名</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">担当者</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">カテゴリー</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">見込み金額</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">理由</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ngAccounts.map((account) => {
                      const categoryName = categories.find(c => c.id === account.categoryId)?.name || '';
                      return (
                        <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{account.customerName}</td>
                          <td className="py-3 px-4 text-gray-600">{account.assignee}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full font-medium text-xs bg-gradient-to-r ${getCategoryColor(categoryName)} text-white`}>
                              {categoryName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-700">
                            {formatCurrencyFull(account.expectedAmount)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                            {account.actionPlan || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingAccount(account);
                                  setShowAccountForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="編集"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.id)}
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
            ) : (
              <p className="text-gray-500 text-center py-8">NG企業がありません</p>
            );
          })()}
        </div>
      </div>

      {/* アカウント登録フォーム */}
      {showAccountForm && (
        <AccountForm
          account={editingAccount}
          categories={categories}
          onSave={handleSaveAccount}
          onCancel={() => {
            setShowAccountForm(false);
            setEditingAccount(null);
          }}
        />
      )}

      {/* カテゴリー追加フォーム */}
      {showCategoryForm && (
        <CategoryForm
          onSave={handleAddCategory}
          onCancel={() => setShowCategoryForm(false)}
        />
      )}
    </div>
  );
}

export default AccountPlanningApp;
