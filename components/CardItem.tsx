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

  const handleSave = async (updatedData: { title: string; description: string }) => {
    try {
      const response = await axios.patch(`/api/cards/${card.id}`, {
        title: updatedData.title,
        description: updatedData.description,
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
        className="bg-white border border-gray-300 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
      >
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
            {cardData.description && (
              <p className="text-gray-600 text-xs mt-1 ml-6 line-clamp-2">
                {cardData.description}
              </p>
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
