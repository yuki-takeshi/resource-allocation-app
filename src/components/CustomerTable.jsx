import React from 'react';

export default function CustomerTable({ customers, categories, onEdit, onDelete }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId || '-';
  };

  const statusColors = {
    '進行中': 'bg-blue-100 text-blue-800',
    '受注': 'bg-green-100 text-green-800',
    '失注': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left font-bold">顧客名</th>
            <th className="border p-2 text-left font-bold">カテゴリ</th>
            <th className="border p-2 text-left font-bold">担当者</th>
            <th className="border p-2 text-left font-bold">アプローチ日</th>
            <th className="border p-2 text-right font-bold">見込み金額（万円）</th>
            <th className="border p-2 text-left font-bold">ステータス</th>
            <th className="border p-2 text-center font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50 border-b">
              <td className="border p-2">{customer.customerName || '-'}</td>
              <td className="border p-2">{getCategoryName(customer.categoryId)}</td>
              <td className="border p-2">{customer.assignee || '-'}</td>
              <td className="border p-2">{customer.approachDate || '-'}</td>
              <td className="border p-2 text-right">
                {customer.expectedAmount ? customer.expectedAmount.toLocaleString() : '-'}
              </td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    statusColors[customer.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {customer.status || '-'}
                </span>
              </td>
              <td className="border p-2 text-center space-x-2">
                <button
                  onClick={() => onEdit(customer)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(customer.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          顧客計画データがありません
        </div>
      )}
    </div>
  );
}
