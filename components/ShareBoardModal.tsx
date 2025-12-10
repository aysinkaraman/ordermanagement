'use client';

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ShareBoardModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onMemberAdded: () => void;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  boardId,
  isOpen,
  onClose,
  members,
  onMemberAdded
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/boards/${boardId}/members`, { email, role });
      toast.success('Member added successfully!');
      setEmail('');
      onMemberAdded();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;

    try {
      await axios.delete(`/api/boards/${boardId}/members/${memberId}`);
      toast.success('Member removed');
      onMemberAdded();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Board</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} className="mb-6">
          <label className="block text-sm font-medium mb-2">Add Member by Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </form>

        {/* Members List */}
        <div>
          <h3 className="text-sm font-medium mb-2">Current Members ({members.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{member.user.name}</div>
                    <div className="text-xs text-gray-500">{member.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded">{member.role}</span>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          💡 <strong>Tip:</strong> Members can view and edit cards on this board. Admins can also manage members.
        </div>
      </div>
    </div>
  );
};
