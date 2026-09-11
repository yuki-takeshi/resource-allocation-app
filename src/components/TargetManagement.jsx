import React, { useState, useEffect } from 'react';
import TargetTable from './TargetTable';
import TargetForm from './TargetForm';

export default function TargetManagement() {
  const [targets, setTargets] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/targets');
      const data = await res.json();
      setTargets(data);
      setError(null);
    } catch (err) {
      setError('目標データの読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarget = async (targetData) => {
    try {
      const method = editingTarget ? 'PUT' : 'POST';
      const url = editingTarget
        ? `http://localhost:3001/api/admin/targets/${editingTarget.id}`
        : 'http://localhost:3001/api/admin/targets';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(targetData)
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      await fetchTargets();
      setIsFormOpen(false);
      setEditingTarget(null);
      setError(null);
    } catch (err) {
      setError('目標の保存に失敗しました: ' + err.message);
    }
  };

  const handleEditTarget = (target) => {
    setEditingTarget(target);
    setIsFormOpen(true);
  };

  const handleDeleteTarget = async (id) => {
    if (!window.confirm('この目標を削除しますか？')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/targets/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      await fetchTargets();
      setError(null);
    } catch (err) {
      setError('目標の削除に失敗しました: ' + err.message);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTarget(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">月別目標管理</h2>
        <button
          onClick={() => {
            setEditingTarget(null);
            setIsFormOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
        >
          + 新規目標
        </button>
      </div>

      {isFormOpen && (
        <TargetForm
          target={editingTarget}
          onSave={handleSaveTarget}
          onCancel={handleCloseForm}
        />
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <TargetTable
          targets={targets}
          onEdit={handleEditTarget}
          onDelete={handleDeleteTarget}
        />
      )}
    </div>
  );
}
