import React, { useState, useEffect } from 'react';

export default function CustomerForm({ customer, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: '',
    categoryId: '',
    assignee: '',
    approachDate: '',
    actionPlan: '',
    expectedAmount: '',
    status: '進行中'
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customerName: customer.customerName || '',
        categoryId: customer.categoryId || '',
        assignee: customer.assignee || '',
        approachDate: customer.approachDate || '',
        actionPlan: customer.actionPlan || '',
        expectedAmount: customer.expectedAmount || '',
        status: customer.status || '進行中'
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const statuses = ['進行中', '受注', '失注'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-gray-200 p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {customer ? '顧客計画を編集' : '新規顧客計画を作成'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 顧客名 */}
            <div>
              <label className="block text-sm font-medium mb-1">顧客名 *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium mb-1">カテゴリ *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 担当者 */}
            <div>
              <label className="block text-sm font-medium mb-1">担当者</label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* アプローチ日 */}
            <div>
              <label className="block text-sm font-medium mb-1">アプローチ日</label>
              <input
                type="date"
                name="approachDate"
                value={formData.approachDate}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 見込み金額 */}
            <div>
              <label className="block text-sm font-medium mb-1">見込み金額（万円）</label>
              <input
                type="number"
                name="expectedAmount"
                value={formData.expectedAmount}
                onChange={handleChange}
                step="0.1"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* ステータス */}
            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* アクションプラン */}
          <div>
            <label className="block text-sm font-medium mb-1">アクションプラン</label>
            <textarea
              name="actionPlan"
              value={formData.actionPlan}
              onChange={handleChange}
              rows="4"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
