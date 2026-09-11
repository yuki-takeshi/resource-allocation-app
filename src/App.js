import { useState, useEffect } from 'react';
import ResourceAllocationApp from './ResourceAllocationApp';
import OrderBacklogApp from './OrderBacklogApp';
import AccountPlanningApp from './AccountPlanningApp';
import CustomerMonthlyDashboard from './CustomerMonthlyDashboard';
import STRACDashboard from './STRACDashboard';
import AdminPanel from './AdminPanel';
import LoginScreen from './LoginScreen';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'orderBacklog';
  });

  // 初期化：セッション情報を確認
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.loggedIn) {
          setLoggedIn(true);
          setUser(data.user);
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
      }
    };
    checkSession();
  }, []);

  // activeTab が変更されたら localStorage に保存
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setLoggedIn(false);
      setUser(null);
      setActiveTab('orderBacklog');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  if (!loggedIn) {
    return <LoginScreen setLoggedIn={setLoggedIn} setUser={setUser} />;
  }

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 flex gap-8 justify-between items-center">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('orderBacklog')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'orderBacklog'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              受注残管理
            </button>
            <button
              onClick={() => setActiveTab('strac')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'strac'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              STRAC受注残
            </button>
            <button
              onClick={() => setActiveTab('customerMonthly')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'customerMonthly'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              月別×顧客別ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('accountPlanning')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'accountPlanning'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              アカウントプラン管理
            </button>
            <button
              onClick={() => setActiveTab('resourceAllocation')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'resourceAllocation'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              リソースアロケーション
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-2 font-medium transition border-b-2 ${
                activeTab === 'admin'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔧 管理画面
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      {activeTab === 'orderBacklog' && <OrderBacklogApp />}
      {activeTab === 'strac' && <STRACDashboard />}
      {activeTab === 'customerMonthly' && <CustomerMonthlyDashboard user={user} />}
      {activeTab === 'accountPlanning' && <AccountPlanningApp />}
      {activeTab === 'resourceAllocation' && <ResourceAllocationApp />}
      {activeTab === 'admin' && <AdminPanel />}
    </div>
  );
}

export default App;
