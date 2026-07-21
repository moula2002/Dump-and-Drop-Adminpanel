import React, { useState, useEffect } from 'react';
import { Percent, Edit2, Save, X } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

function CommissionSettings() {
  const [commission, setCommission] = useState();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(80);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCommission();
  }, []);

  const fetchCommission = async () => {
    try {
      const response = await adminAPI.getDriverCommission();
      const fetchedCommission = response.data.commission !== undefined ? response.data.commission : 80;
      setCommission(fetchedCommission);
      setEditValue(fetchedCommission);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateCommissionSettings({ driverCommission: editValue });
      setCommission(editValue);
      setEditing(false);
      toast.success('Commission updated successfully');
    } catch (error) {
      toast.error('Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(commission);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center min-w-[350px]">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Percent className="w-12 h-12 text-green-600" />
        </div>

        <p className="text-gray-500 mb-2">Driver Commission (Common)</p>
        <p className="text-sm text-gray-400 mb-4">Same commission for Cab & Goods drivers</p>

        {editing ? (
          <div className="mb-4">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
              className="text-4xl font-bold text-center w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              autoFocus
            />
            <p className="text-sm text-gray-400 mt-1">Enter percentage (0-100%)</p>
          </div>
        ) : (
          <p className="text-6xl font-bold text-green-600 mb-4">{commission}%</p>
        )}

        <div className="flex gap-3 justify-center mt-4">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Commission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommissionSettings;