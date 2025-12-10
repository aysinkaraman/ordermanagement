'use client';

import React, { useState, useCallback } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardItem } from './CardItem';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { Column, Card } from '@prisma/client';

interface BoardColumnProps {
  column: Column & { cards: Card[] };
  onDelete: (columnId: string) => void;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ column, onDelete }) => {
  const [cards, setCards] = useState<Card[]>(column.cards);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [loading, setLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardTitle, setCardTitle] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddCard = useCallback(async () => {
    if (!cardTitle.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/cards', {
        columnId: column.id,
        title: cardTitle,
      });
      setCards((prev) => [...prev, response.data]);
      setCardTitle('');
      setShowCardForm(false);
      toast.success('Card created!');
    } catch (error) {
      toast.error('Failed to create card');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [cardTitle, column.id]);

  const handleUpdateTitle = useCallback(async () => {
    if (!title.trim()) {
      setTitle(column.title);
      setEditingTitle(false);
      return;
    }

    try {
      await axios.patch(`/api/columns/${column.id}`, { title });
      setEditingTitle(false);
      toast.success('Column title updated!');
    } catch (error) {
      setTitle(column.title);
      toast.error('Failed to update column');
      console.error(error);
    }
  }, [column.id, title]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    try {
      await axios.delete(`/api/cards/${cardId}`);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      toast.success('Card deleted!');
    } catch (error) {
      toast.error('Failed to delete card');
      console.error(error);
    }
  }, []);

  const handleCardUpdate = useCallback((updatedCard: Card) => {
    setCards((prev) =>
      prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    );
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-72 bg-white rounded-lg shadow-md overflow-hidden transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            ⋮⋮
          </div>
          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateTitle();
                }
              }}
              autoFocus
              className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600"
            >
              {title}
            </h2>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm('Delete this column?')) {
              onDelete(column.id);
            }
          }}
          className="text-red-500 hover:text-red-700 font-bold ml-2"
        >
          ×
        </button>
      </div>

      {/* Cards Container */}
      <SortableContext items={cards} strategy={verticalListSortingStrategy}>
        <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {cards.length === 0 && (
            <div className="text-center py-8 text-gray-400">No cards yet</div>
          )}
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              columnId={column.id}
              onDelete={handleDeleteCard}
              onUpdate={handleCardUpdate}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card Form */}
      {showCardForm ? (
        <div className="p-4 border-t border-gray-200 space-y-2">
          <input
            type="text"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="Card title..."
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded py-2 font-semibold disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowCardForm(false);
                setCardTitle('');
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded py-2 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCardForm(true)}
          className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 border-t border-gray-200 text-sm font-semibold transition-colors"
        >
          + Add Card
        </button>
      )}
    </div>
  );
};
