'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { Card, Comment, Activity, Attachment } from '@prisma/client';

interface CardModalProps {
  card: Card;
  columnId: string;
  onClose: () => void;
  onSave: (data: { title: string; description: string; dueDate?: Date | null; labels?: string[]; coverImage?: string | null }) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  columnId: _columnId,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState<string>(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : '');
  const [labels, setLabels] = useState<string[]>(card.labels || []);
  const [newLabel, setNewLabel] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(card.coverImage || null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [_loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [commentsRes, activitiesRes] = await Promise.all([
          axios.get(`/api/cards/${card.id}`),
          axios.get(`/api/activities/${card.id}`),
        ]);
        setComments(commentsRes.data.comments || []);
        setActivities(activitiesRes.data || []);
        setAttachments(commentsRes.data.attachments || []);
      } catch (error) {
        console.error('Error fetching card details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [card.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post('/api/comments', {
        cardId: card.id,
        text: newComment,
      });
      setComments((prev) => [response.data, ...prev]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    }
  };

  const handleSave = async () => {
    onSave({ 
      title, 
      description, 
      dueDate: dueDate ? new Date(dueDate) : null,
      labels,
      coverImage
    });
  };

  const handleAddLabel = () => {
    if (!newLabel.trim() || labels.includes(newLabel.trim())) return;
    setLabels([...labels, newLabel.trim()]);
    setNewLabel('');
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };

  const handleCoverImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setCoverImage(dataUrl);
      toast.success('Cover image updated!');
    } catch (error) {
      toast.error('Failed to upload cover image');
      console.error(error);
    } finally {
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const dataUrl = await fileToDataUrl(file);

          const response = await axios.post('/api/attachments', {
            cardId: card.id,
            filename: file.name,
            url: dataUrl,
            size: file.size,
            mimeType: file.type,
          });

          return response.data;
        })
      );

      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success('Attachment(s) added!');
    } catch (error) {
      toast.error('Failed to upload attachment');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      await axios.delete(`/api/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      toast.success('Attachment deleted!');
    } catch (error) {
      toast.error('Failed to delete attachment');
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Card Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Due Date Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Labels Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏷️ Labels
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {label}
                  <button
                    onClick={() => handleRemoveLabel(label)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                placeholder="Add label..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddLabel}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Cover Image Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🖼️ Cover Image
            </label>
            {coverImage && (
              <div className="mb-2 relative">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={handleRemoveCoverImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              onChange={handleCoverImageSelect}
              accept="image/*"
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {coverImage ? 'Change Cover' : 'Add Cover'}
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Save Changes
          </button>

          <hr className="border-gray-300" />

          {/* Attachments Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h3>

            {/* Add Attachment Button */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Uploading...' : '📎 Add Attachment'}
              </label>
            </div>

            {/* Attachments List */}
            <div className="space-y-2">
              {attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">No attachments yet</p>
              ) : (
                attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download={attachment.filename}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:text-blue-600"
                    >
                      <span className="text-2xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-medium truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                        </p>
                      </div>
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>

            {/* Add Comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                onClick={handleAddComment}
                className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                Add Comment
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <p className="text-gray-800 text-sm">{comment.text}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Activity Log Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity</h3>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet</p>
              ) : (
                activities.map((activity) => {
                  // activity.user: { id, name, avatar } | undefined
                  const user = (activity as any).user;
                  return (
                    <div key={activity.id} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {user && user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || 'User'}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-base font-bold border">
                            {user && user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      {/* User name and message */}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-800">
                          {user && user.name ? user.name : 'Unknown User'}
                        </span>
                        <span className="ml-1 text-gray-600">{activity.message}</span>
                      </div>
                      {/* Date */}
                      <span className="text-gray-400 ml-2 whitespace-nowrap">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
