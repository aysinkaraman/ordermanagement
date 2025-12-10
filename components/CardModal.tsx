'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { Card, Comment, Activity, Attachment } from '@prisma/client';

interface CardModalProps {
  card: Card;
  columnId: string;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  columnId,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSave({ title, description });
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
                activities.map((activity) => (
                  <div key={activity.id} className="text-sm text-gray-600">
                    <span className="font-medium">{activity.message}</span>
                    <span className="text-gray-400 ml-2">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
