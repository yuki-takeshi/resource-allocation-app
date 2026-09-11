import React, { useState, useEffect } from 'react';
import CustomerTable from './CustomerTable';
import CustomerForm from './CustomerForm';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/customers');
      const data = await res.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('顧客計画データの読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('カテゴリの取得に失敗:', err);
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      const method = editingCustomer ? 'PUT' : 'POST';
      const url = editingCustomer
        ? `http://localhost:3001/api/admin/customers/${editingCustomer.id}`
        : 'http://localhost:3001/api/account-planning';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customerData)
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      await fetchCustomers();
      setIsFormOpen(false);
      setEditingCustomer(null);
      setError(null);
    } catch (err) {
      setError('顧客計画の保存に失敗しました: ' + err.message);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('この顧客計画を削除しますか？')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/customers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      await fetchCustomers();
      setError(null);
    } catch (err) {
      setError('顧客計画の削除に失敗しました: ' + err.message);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">顧客計画管理</h2>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
        >
          + 新規顧客計画
        </button>
      </div>

      {isFormOpen && (
        <CustomerForm
          customer={editingCustomer}
          categories={categories}
          onSave={handleSaveCustomer}
          onCancel={handleCloseForm}
        />
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <CustomerTable
          customers={customers}
          categories={categories}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
        />
      )}
    </div>
  );
}
