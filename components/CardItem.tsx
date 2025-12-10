'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardModal } from './CardModal';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { Card } from '@prisma/client';

interface CardItemProps {
  card: Card;
  columnId: string;
  onDelete: (cardId: string) => void;
  onUpdate: (card: Card) => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  columnId,
  onDelete,
  onUpdate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [cardData, setCardData] = useState(card);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    onDelete(card.id);
  };

  const handleSave = async (updatedData: { 
    title: string; 
    description: string; 
    dueDate?: Date | null; 
    labels?: string[]; 
    coverImage?: string | null 
  }) => {
    try {
      const response = await axios.patch(`/api/cards/${card.id}`, {
        title: updatedData.title,
        description: updatedData.description,
        dueDate: updatedData.dueDate,
        labels: updatedData.labels,
        coverImage: updatedData.coverImage,
        columnId,
      });
      setCardData(response.data);
      onUpdate(response.data);
      toast.success('Card updated!');
    } catch (error) {
      toast.error('Failed to update card');
      console.error(error);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={() => setShowModal(true)}
        className="bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Cover Image */}
        {cardData.coverImage && (
          <img
            src={cardData.coverImage}
            alt="Cover"
            className="w-full h-32 object-cover"
          />
        )}
        
        <div className="p-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⋮⋮
                </div>
                <h3 className="font-semibold text-gray-800 text-sm break-words">
                  {cardData.title}
                </h3>
              </div>
              
              {/* Labels */}
              {cardData.labels && cardData.labels.length > 0 && (
                <div className="flex gap-1 mt-2 ml-6 flex-wrap">
                  {cardData.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              
              {cardData.description && (
                <p className="text-gray-600 text-xs mt-1 ml-6 line-clamp-2">
                  {cardData.description}
                </p>
              )}
              
              {/* Due Date */}
              {cardData.dueDate && (
                <div className="flex items-center gap-1 mt-2 ml-6 text-xs">
                  <span>📅</span>
                  <span className={`font-medium ${
                    new Date(cardData.dueDate) < new Date() 
                      ? 'text-red-600' 
                      : new Date(cardData.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                      ? 'text-orange-600'
                      : 'text-gray-600'
                  }`}>
                    {new Date(cardData.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="text-red-500 hover:text-red-700 font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <CardModal
          card={cardData}
          columnId={columnId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};
