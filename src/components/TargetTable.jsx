import React from 'react';

export default function TargetTable({ targets, onEdit, onDelete }) {
  // 月ごとにグループ化
  const groupedByMonth = targets.reduce((acc, target) => {
    if (!acc[target.month]) {
      acc[target.month] = [];
    }
    acc[target.month].push(target);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left font-bold">月</th>
            <th className="border p-2 text-left font-bold">部署</th>
            <th className="border p-2 text-right font-bold">目標値（万円）</th>
            <th className="border p-2 text-center font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {sortedMonths.length === 0 ? (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-gray-500">
                目標データがありません
              </td>
            </tr>
          ) : (
            sortedMonths.map(month => (
              <React.Fragment key={month}>
                {groupedByMonth[month].map((target, index) => (
                  <tr key={target.id} className="hover:bg-gray-50 border-b">
                    {index === 0 && (
                      <td
                        rowSpan={groupedByMonth[month].length}
                        className="border p-2 font-bold bg-blue-50"
                      >
                        {month}
                      </td>
                    )}
                    <td className="border p-2">{target.department || '-'}</td>
                    <td className="border p-2 text-right">
                      {target.target ? target.target.toLocaleString() : '-'}
                    </td>
                    <td className="border p-2 text-center space-x-2">
                      <button
                        onClick={() => onEdit(target)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => onDelete(target.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
