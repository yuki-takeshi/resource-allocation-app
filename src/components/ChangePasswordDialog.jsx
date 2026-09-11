import React, { useState } from 'react';

export default function ChangePasswordDialog({ onPasswordChanged }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (formData.newPassword.length < 8) {
      setError('新しいパスワードは8文字以上である必要があります');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致していません');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'パスワード変更に失敗しました');
      }

      onPasswordChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-md w-full mx-4">
        <div className="bg-yellow-100 border-b border-yellow-300 p-4">
          <h3 className="text-lg font-bold text-yellow-800">
            ⚠️ パスワード変更が必須です
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            初回ログイン時のため、パスワードを変更する必要があります。
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* 現在のパスワード */}
          <div>
            <label className="block text-sm font-medium mb-1">現在のパスワード *</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              メールで受け取った初回パスワードを入力してください
            </p>
          </div>

          {/* 新しいパスワード */}
          <div>
            <label className="block text-sm font-medium mb-1">新しいパスワード *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="8文字以上"
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              8文字以上の任意のパスワードを設定してください
            </p>
          </div>

          {/* 確認用パスワード */}
          <div>
            <label className="block text-sm font-medium mb-1">新しいパスワード（確認） *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium"
            >
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
