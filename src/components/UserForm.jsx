import React, { useState } from 'react';

export default function UserForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: ''
  });

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
    setFormData({ username: '', email: '', displayName: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-md w-full mx-4">
        <div className="bg-gray-200 p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">新規ユーザーを作成</h3>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ユーザー名 */}
          <div>
            <label className="block text-sm font-medium mb-1">ユーザー名 *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="例: kurokawa.hayato"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* メール */}
          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="例: hayato.kurokawa@nextam.jp"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* 表示名 */}
          <div>
            <label className="block text-sm font-medium mb-1">表示名 *</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              placeholder="例: 黒川 駿斗"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <strong>📧 自動処理：</strong><br />
            初回パスワードが自動生成され、入力したメールアドレスに送信されます。
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
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
