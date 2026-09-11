import React from 'react';

export default function UserTable({ users, onResetPassword, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const isPasswordExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left font-bold">ユーザー名</th>
            <th className="border p-2 text-left font-bold">メール</th>
            <th className="border p-2 text-left font-bold">表示名</th>
            <th className="border p-2 text-left font-bold">パスワード期限</th>
            <th className="border p-2 text-left font-bold">状態</th>
            <th className="border p-2 text-center font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 border-b">
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">{user.email || '-'}</td>
              <td className="border p-2">{user.displayName}</td>
              <td className="border p-2">
                <span className={isPasswordExpired(user.passwordExpiresAt) ? 'text-red-600 font-bold' : ''}>
                  {formatDate(user.passwordExpiresAt)}
                </span>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.isActive ? '有効' : '無効'}
                  </span>
                  {user.mustChangePassword ? (
                    <span className="block px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800">
                      パスワード変更必須
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="border p-2 text-center space-x-2">
                <button
                  onClick={() => onResetPassword(user.id, user.displayName)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                  title="パスワードをリセット"
                >
                  リセット
                </button>
                <button
                  onClick={() => onDelete(user.id, user.displayName)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  title="ユーザーを削除"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          ユーザーがいません
        </div>
      )}
    </div>
  );
}
