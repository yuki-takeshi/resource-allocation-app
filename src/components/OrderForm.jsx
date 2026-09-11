import React, { useState, useEffect } from 'react';

export default function OrderForm({ order, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    customer: '',
    amount: '',
    orderDate: '',
    deliveryMonth: '',
    department: '',
    rank: '',
    remarks: '',
    status: '進行中',
    lossDate: '',
    lossReason: ''
  });

  useEffect(() => {
    if (order) {
      setFormData({
        name: order.name || '',
        customer: order.customer || '',
        amount: order.amount || '',
        orderDate: order.orderDate || '',
        deliveryMonth: order.deliveryMonth || '',
        department: order.department || '',
        rank: order.rank || '',
        remarks: order.remarks || '',
        status: order.status || '進行中',
        lossDate: order.lossDate || '',
        lossReason: order.lossReason || ''
      });
    }
  }, [order]);

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

  const departments = ['開発事業部', '営業部', 'MGその他'];
  const ranks = ['A', 'B', 'C', 'D', 'E'];
  const statuses = ['受注確定', '進行中', '完了', '失注'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-gray-200 p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {order ? '注文を編集' : '新規注文を作成'}
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
            {/* 案件名 */}
            <div>
              <label className="block text-sm font-medium mb-1">案件名 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 顧客名 */}
            <div>
              <label className="block text-sm font-medium mb-1">顧客名</label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 金額（万円） */}
            <div>
              <label className="block text-sm font-medium mb-1">金額（万円）</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.1"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 受注日 */}
            <div>
              <label className="block text-sm font-medium mb-1">受注日</label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 納期月 */}
            <div>
              <label className="block text-sm font-medium mb-1">納期月</label>
              <input
                type="month"
                name="deliveryMonth"
                value={formData.deliveryMonth}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 部署 */}
            <div>
              <label className="block text-sm font-medium mb-1">部署</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* ランク */}
            <div>
              <label className="block text-sm font-medium mb-1">ランク</label>
              <select
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
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

            {/* 失注日 */}
            <div>
              <label className="block text-sm font-medium mb-1">失注日</label>
              <input
                type="date"
                name="lossDate"
                value={formData.lossDate}
                onChange={handleChange}
                disabled={formData.status !== '失注'}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* 失注理由 */}
            <div>
              <label className="block text-sm font-medium mb-1">失注理由</label>
              <input
                type="text"
                name="lossReason"
                value={formData.lossReason}
                onChange={handleChange}
                disabled={formData.status !== '失注'}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-medium mb-1">摘要（備考）</label>
            <textarea
              name="remarks"
              value={formData.remarks}
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
