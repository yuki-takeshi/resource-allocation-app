import React, { useState, useEffect } from 'react';
import OrderManagement from './components/OrderManagement';
import TargetManagement from './components/TargetManagement';
import CustomerManagement from './components/CustomerManagement';
import UserManagement from './components/UserManagement';
import ChangePasswordDialog from './components/ChangePasswordDialog';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('orders');
  const [user, setUser] = useState(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch('http://localhost:3001/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
        // パスワード変更が必須の場合、ダイアログを表示
        if (data.user.mustChangePassword) {
          setShowChangePasswordDialog(true);
        }
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    window.location.href = '/';
  };

  if (!user) {
    return <div className="p-4 text-center">ログインしてください</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">管理画面</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">ユーザー: {user.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white border-b shadow">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 注文情報
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'targets'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 月別目標
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 顧客計画
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔐 ユーザー管理
            </button>
          </div>
        </div>
      </div>

      {/* パスワード変更ダイアログ */}
      {showChangePasswordDialog && (
        <ChangePasswordDialog
          onPasswordChanged={() => {
            setShowChangePasswordDialog(false);
            // セッション再確認
            const checkSession = async () => {
              const res = await fetch('http://localhost:3001/api/auth/session', { credentials: 'include' });
              const data = await res.json();
              if (data.loggedIn) {
                setUser(data.user);
              }
            };
            checkSession();
          }}
        />
      )}

      {/* コンテンツ */}
      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'targets' && <TargetManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
}
