import React from 'react';

export default function OrderTable({ orders, onEdit, onDelete }) {
  const statusColors = {
    '受注確定': 'bg-green-100 text-green-800',
    '進行中': 'bg-blue-100 text-blue-800',
    '完了': 'bg-gray-100 text-gray-800',
    '失注': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left font-bold">案件名</th>
            <th className="border p-2 text-left font-bold">顧客名</th>
            <th className="border p-2 text-right font-bold">金額（万円）</th>
            <th className="border p-2 text-left font-bold">受注日</th>
            <th className="border p-2 text-left font-bold">納期月</th>
            <th className="border p-2 text-left font-bold">部署</th>
            <th className="border p-2 text-left font-bold">ランク</th>
            <th className="border p-2 text-left font-bold">ステータス</th>
            <th className="border p-2 text-center font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 border-b">
              <td className="border p-2">{order.name || '-'}</td>
              <td className="border p-2">{order.customer || '-'}</td>
              <td className="border p-2 text-right">
                {order.amount ? order.amount.toLocaleString() : '-'}
              </td>
              <td className="border p-2">{order.orderDate || '-'}</td>
              <td className="border p-2">{order.deliveryMonth || '-'}</td>
              <td className="border p-2">{order.department || '-'}</td>
              <td className="border p-2">{order.rank || '-'}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    statusColors[order.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status || '-'}
                </span>
              </td>
              <td className="border p-2 text-center space-x-2">
                <button
                  onClick={() => onEdit(order)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(order.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          注文データがありません
        </div>
      )}
    </div>
  );
}
