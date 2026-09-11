import React, { useState, useEffect } from 'react';
import OrderTable from './OrderTable';
import OrderForm from './OrderForm';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/orders');
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError('注文データの読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      const method = editingOrder ? 'PUT' : 'POST';
      const url = editingOrder
        ? `http://localhost:3001/api/admin/orders/${editingOrder.id}`
        : 'http://localhost:3001/api/orders';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      await fetchOrders();
      setIsFormOpen(false);
      setEditingOrder(null);
      setError(null);
    } catch (err) {
      setError('注文の保存に失敗しました: ' + err.message);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('この注文を削除しますか？')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      await fetchOrders();
      setError(null);
    } catch (err) {
      setError('注文の削除に失敗しました: ' + err.message);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">注文情報管理</h2>
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsFormOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
        >
          + 新規注文
        </button>
      </div>

      {isFormOpen && (
        <OrderForm
          order={editingOrder}
          onSave={handleSaveOrder}
          onCancel={handleCloseForm}
        />
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <OrderTable
          orders={orders}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
        />
      )}
    </div>
  );
}
