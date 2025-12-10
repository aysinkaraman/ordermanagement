'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardColumn } from './BoardColumn';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { Column, Card } from '@prisma/client';

interface BoardProps {
  initialColumns: (Column & { cards: Card[] })[];
}

export const Board: React.FC<BoardProps> = ({ initialColumns }) => {
  const [columns, setColumns] = useState<(Column & { cards: Card[] })[]>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddColumn = useCallback(async () => {
    const title = prompt('Enter column title:');
    if (!title) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/columns', { title });
      setColumns((prev: any) => [...prev, response.data]);
      toast.success('Column created!');
    } catch (error) {
      toast.error('Failed to create column');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    try {
      await axios.delete(`/api/columns/${columnId}`);
      setColumns((prev: any) => prev.filter((col: Column) => col.id !== columnId));
      toast.success('Column deleted!');
    } catch (error) {
      toast.error('Failed to delete column');
      console.error(error);
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determine if dragging a column or card
    const isColumn = columns.some(col => col.id === active.id);
    setActiveType(isColumn ? 'column' : 'card');
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Only handle card drag over different columns
    if (activeType === 'card') {
      const activeColumn = columns.find(col => 
        col.cards.some(card => card.id === activeId)
      );
      const overColumn = columns.find(col => 
        col.id === overId || col.cards.some(card => card.id === overId)
      );

      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
        return;
      }

      setColumns(prevColumns => {
        const activeCards = activeColumn.cards;
        const activeCard = activeCards.find(card => card.id === activeId);
        
        if (!activeCard) return prevColumns;

        return prevColumns.map(col => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              cards: col.cards.filter(card => card.id !== activeId)
            };
          }
          if (col.id === overColumn.id) {
            return {
              ...col,
              cards: [...col.cards, activeCard]
            };
          }
          return col;
        });
      });
    }
  }, [columns, activeType]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeType === 'column') {
      // Handle column reordering
      const oldIndex = columns.findIndex((col) => col.id === activeId);
      const newIndex = columns.findIndex((col) => col.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);

        // Update order in database
        try {
          await Promise.all(
            newColumns.map((col, idx) =>
              axios.patch(`/api/columns/${col.id}`, { order: idx })
            )
          );
        } catch (error) {
          toast.error('Failed to update column order');
          console.error(error);
        }
      }
    } else if (activeType === 'card') {
      // Handle card movement
      const activeColumn = columns.find(col => 
        col.cards.some(card => card.id === activeId)
      );
      const overColumn = columns.find(col => 
        col.id === overId || col.cards.some(card => card.id === overId)
      );

      if (!activeColumn || !overColumn) return;

      if (activeColumn.id === overColumn.id) {
        // Reorder within same column
        const oldIndex = activeColumn.cards.findIndex(card => card.id === activeId);
        const newIndex = activeColumn.cards.findIndex(card => card.id === overId);

        if (oldIndex !== newIndex) {
          const newCards = arrayMove(activeColumn.cards, oldIndex, newIndex);
          setColumns(prevColumns =>
            prevColumns.map(col =>
              col.id === activeColumn.id ? { ...col, cards: newCards } : col
            )
          );

          // Update order in database
          try {
            await Promise.all(
              newCards.map((card, idx) =>
                axios.patch(`/api/cards/${card.id}`, { 
                  columnId: activeColumn.id,
                  order: idx 
                })
              )
            );
          } catch (error) {
            toast.error('Failed to update card order');
            console.error(error);
          }
        }
      } else {
        // Move to different column
        try {
          await axios.patch(`/api/cards/${activeId}`, {
            columnId: overColumn.id
          });
          toast.success('Card moved!');
        } catch (error) {
          toast.error('Failed to move card');
          console.error(error);
          // Revert on error
          setColumns(columns);
        }
      }
    }
  }, [columns, activeType]);

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-6 shadow-lg">
          <h1 className="text-3xl font-bold">Kanban Board</h1>
        </header>

        <main className="flex-1 overflow-x-auto p-6">
          <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-6 min-w-min pb-4">
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  onDelete={handleDeleteColumn}
                />
              ))}

              <button
                onClick={handleAddColumn}
                disabled={loading}
                className="flex-shrink-0 w-72 h-fit bg-gray-200 hover:bg-gray-300 rounded-lg p-4 font-semibold text-gray-700 transition-colors disabled:opacity-50"
              >
                + Add Column
              </button>
            </div>
          </SortableContext>
        </main>
      </div>

      <DragOverlay>{activeId && <div className="bg-white p-4 rounded shadow-lg">Dragging...</div>}</DragOverlay>
    </DndContext>
  );
};
