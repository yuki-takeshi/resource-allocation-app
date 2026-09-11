import React, { useState, useEffect } from 'react';

export default function TargetForm({ target, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    month: '',
    department: '',
    target: ''
  });

  useEffect(() => {
    if (target) {
      setFormData({
        month: target.month || '',
        department: target.department || '',
        target: target.target || ''
      });
    }
  }, [target]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-md w-full mx-4">
        <div className="bg-gray-200 p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {target ? '目標を編集' : '新規目標を作成'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 月 */}
          <div>
            <label className="block text-sm font-medium mb-1">月 *</label>
            <input
              type="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* 部署 */}
          <div>
            <label className="block text-sm font-medium mb-1">部署 *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">選択してください</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* 目標値 */}
          <div>
            <label className="block text-sm font-medium mb-1">目標値（万円） *</label>
            <input
              type="number"
              name="target"
              value={formData.target}
              onChange={handleChange}
              required
              step="0.1"
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
