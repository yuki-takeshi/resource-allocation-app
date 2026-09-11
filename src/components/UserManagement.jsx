import React, { useState, useEffect } from 'react';
import UserTable from './UserTable';
import UserForm from './UserForm';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('ユーザーデータの読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '作成に失敗しました');
      }

      setSuccessMessage(`✅ ${userData.displayName} を作成しました。初回パスワードがメールで送信されました。`);
      await fetchUsers();
      setIsFormOpen(false);
      setError(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (userId, displayName) => {
    if (!window.confirm(`${displayName} のパスワードをリセットしますか？`)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'リセットに失敗しました');
      }

      setSuccessMessage(`✅ ${displayName} のパスワードがリセットされました。新しい初回パスワードがメールで送信されました。`);
      await fetchUsers();
      setError(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId, displayName) => {
    if (!window.confirm(`${displayName} を削除しますか？`)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      setSuccessMessage(`✅ ${displayName} を削除しました。`);
      await fetchUsers();
      setError(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">ユーザー管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
        >
          + 新規ユーザー
        </button>
      </div>

      {isFormOpen && (
        <UserForm
          onSave={handleCreateUser}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <UserTable
          users={users}
          onResetPassword={handleResetPassword}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
}
