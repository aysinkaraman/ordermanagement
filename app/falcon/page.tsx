'use client';

import React, { useEffect, useRef, useState } from 'react';

const CURRENT_USER = 'Ayşin';

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 6,
  fontSize: 14,
};

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px dashed #b5b5c0',
  background: '#f8f8fb',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 13,
  color: '#4a4a55',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  fontSize: 13,
  outline: 'none',
};

const BRAND_PRIMARY = '#D97706';
const BRAND_SECONDARY = '#78350F';
const BRAND_LIGHT = '#FEF3C7';

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: BRAND_PRIMARY,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#333',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const menuItemStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  color: '#222',
  background: '#f7f7f9',
  marginBottom: 6,
};

type Comment = {
  id: number;
  text: string;
  author: string;
  createdAt: string;
};

type Attachment = {
  id: string | number;
  name: string;
  size: number;
  type: string;
  url: string;
  note?: string | null;
  createdAt?: string;
};

type Activity = {
  id: number;
  type: 'move';
  author: string;
  from: string;
  to: string;
  createdAt: string;
};

type Card = {
  id: string | number;
  columnId: string | number;
  orderNumber: string;
  customerName?: string | null;
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: Activity[];
};

type Column = {
  id: string | number;
  name: string;
  cards: Card[];
};

type ColumnSettings = {
  color?: string | null;
  sortDirection?: 'asc' | 'desc';
};

export default function App() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  const [newColumnName, setNewColumnName] = useState('');
  const [columnSaving, setColumnSaving] = useState(false);

  const [activeAddColumnId, setActiveAddColumnId] = useState<string | number | null>(null);
  const [newCardText, setNewCardText] = useState('');
  const [cardSaving, setCardSaving] = useState(false);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [newComment, setNewComment] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  const [attachmentNotes, setAttachmentNotes] = useState<Record<string | number, string>>({});
  const [attachmentSaving, setAttachmentSaving] = useState<string | number | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragDataRef = useRef<{ cardId: string | number | null; fromColumnId: string | number | null }>({
    cardId: null,
    fromColumnId: null,
  });

  const [draggingColumnId, setDraggingColumnId] = useState<string | number | null>(null);
  const [openListMenuId, setOpenListMenuId] = useState<string | number | null>(null);
  const [columnSettings, setColumnSettings] = useState<Record<string | number, ColumnSettings>>({});

  const mapApiAttachment = (apiAtt: any): Attachment => ({
    id: apiAtt.id,
    name: apiAtt.filename ?? apiAtt.name ?? 'Dosya',
    size: apiAtt.size ?? 0,
    type: apiAtt.mimeType ?? apiAtt.type ?? '',
    url: apiAtt.url,
    note: apiAtt.note ?? '',
    createdAt: apiAtt.createdAt,
  });

  const mapApiCard = (apiCard: any): Card => ({
    id: apiCard.id,
    columnId: apiCard.columnId,
    orderNumber: apiCard.title ?? '',
    customerName: apiCard.description ?? '',
    comments: apiCard.comments || [],
    attachments: (apiCard.attachments || []).map(mapApiAttachment),
    activities: apiCard.activities || [],
  });

  const mapApiColumn = (apiCol: any): Column => ({
    id: apiCol.id,
    name: apiCol.title ?? '',
    cards: (apiCol.cards || []).map(mapApiCard),
  });

  const colorPalette = [
    '#D97706',
    '#78350F',
    '#FEF3C7',
    '#FB923C',
    '#F59E0B',
    '#B45309',
    '#92400E',
    '#F97316',
    '#EA580C',
    '#92400E',
  ];

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/columns');
        const data = await res.json();
        if (mounted) setColumns((data || []).map(mapApiColumn));
      } catch (e) {
        console.error('Failed to load columns', e);
        if (mounted) setColumns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helpers
  const findColumnById = (colId: string | number, cols: Column[] = columns) =>
    cols.find((c) => String(c.id) === String(colId));

  const updateCardInState = (
    cardId: string | number,
    updater: (card: Card, col: Column | undefined) => Card
  ) => {
    setColumns((prev) =>
      prev.map((col) => {
        const idx = (col.cards || []).findIndex((c) => String(c.id) === String(cardId));
        if (idx === -1) return col;
        const updatedCard = updater(col.cards[idx], col);
        const newCards = [...col.cards];
        newCards[idx] = updatedCard;
        return { ...col, cards: newCards };
      })
    );
    setActiveCard((prev) => {
      if (!prev || String(prev.id) !== String(cardId)) return prev;
      const updated = updater(prev, findColumnById(prev.columnId));
      return updated;
    });
  };

  const formatSizeKB = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  // Column CRUD
  const handleAddColumn = async () => {
    const name = newColumnName.trim();
    if (!name) return;
    setColumnSaving(true);
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name }),
      });
      const created = await res.json();
      const mapped = mapApiColumn(created);
      setColumns((prev) => [...prev, mapped]);
      setNewColumnName('');
    } catch (e) {
      console.error('Add column failed', e);
      alert('Kolon eklenemedi.');
    } finally {
      setColumnSaving(false);
    }
  };

  const handleRenameColumn = async (columnId: string | number, currentName: string) => {
    const newName = prompt('Yeni kolon adı', currentName);
    if (!newName || !newName.trim()) return;
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName.trim() }),
      });
      const updated = mapApiColumn(await res.json());
      setColumns((prev) => prev.map((c) => (c.id === columnId ? updated : c)));
      setOpenListMenuId(null);
    } catch (e) {
      console.error('Rename column failed', e);
      alert('Kolon adı güncellenemedi.');
    }
  };

  const handleDeleteColumn = async (columnId: string | number) => {
    if (!window.confirm('Bu kolonu silmek istiyor musun?')) return;
    try {
      await fetch(`/api/columns/${columnId}`, { method: 'DELETE' });
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      if (openListMenuId === columnId) setOpenListMenuId(null);
    } catch (e) {
      console.error('Delete column failed', e);
      alert('Kolon silinemedi.');
    }
  };

  // Card CRUD
  const handleAddCard = async (columnId: string | number) => {
    const value = newCardText.trim();
    if (!value) return;
    setCardSaving(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, title: value, description: '' }),
      });
      const created = mapApiCard(await res.json());
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId
            ? {
                ...c,
                cards: [...(c.cards || []), { ...created, comments: [], attachments: [], activities: [] }],
              }
            : c
        )
      );
      setNewCardText('');
      setActiveAddColumnId(null);
    } catch (e) {
      console.error('Add card failed', e);
      alert('Kart eklenemedi.');
    } finally {
      setCardSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string | number, columnId: string | number) => {
    if (!window.confirm('Bu kartı silmek istiyor musun?')) return;
    try {
      await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId
            ? { ...c, cards: (c.cards || []).filter((card) => card.id !== cardId) }
            : c
        )
      );
      if (activeCard && String(activeCard.id) === String(cardId)) setActiveCard(null);
    } catch (e) {
      console.error('Delete card failed', e);
      alert('Kart silinemedi.');
    }
  };

  // Modal control
  const openCardModal = (card: Card) => {
    setActiveCard(card);
    setDescriptionDraft(card.customerName || '');
    setAttachmentNotes(() => {
      const next: Record<string | number, string> = {};
      (card.attachments || []).forEach((att) => {
        next[att.id] = att.note || '';
      });
      return next;
    });
  };
  const closeCardModal = () => {
    setActiveCard(null);
    setDescriptionDraft('');
    setAttachmentNotes({});
  };

  const handleSaveDescription = async () => {
    if (!activeCard) return;
    const desc = descriptionDraft.trim();
    setDescriptionSaving(true);
    try {
      await fetch(`/api/cards/${activeCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      updateCardInState(activeCard.id, (card) => ({ ...card, customerName: desc }));
    } catch (e) {
      console.error('Description save failed', e);
      alert('Açıklama kaydedilemedi.');
    } finally {
      setDescriptionSaving(false);
    }
  };

  // Comments
  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text || !activeCard) return;
    const newEntry: Comment = {
      id: Date.now(),
      text,
      author: CURRENT_USER,
      createdAt: new Date().toISOString(),
    };
    updateCardInState(activeCard.id, (card) => ({
      ...card,
      comments: [...(card.comments || []), newEntry],
    }));
    setNewComment('');
  };

  // Attachments
  const handleAddAttachment = (file: File) => {
    if (!file || !activeCard) return;

    const toDataUrl = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    (async () => {
      try {
        const dataUrl = await toDataUrl(file);
        const attachment: Attachment = {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: dataUrl,
          note: '',
          createdAt: new Date().toISOString(),
        };
        updateCardInState(activeCard.id, (card) => ({
          ...card,
          attachments: [...(card.attachments || []), attachment],
        }));
        setAttachmentNotes((prev) => ({ ...prev, [attachment.id]: '' }));
      } catch (err) {
        console.error('Attachment read failed', err);
        alert('Dosya eklenemedi.');
      }
    })();
  };

  const handleSaveAttachmentNote = async (attId: string | number) => {
    if (!activeCard) return;
    const note = attachmentNotes[attId] || '';
    setAttachmentSaving(attId);
    try {
      await fetch(`/api/attachments/${attId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
    } catch (e) {
      console.error('Attachment note save failed', e);
    } finally {
      updateCardInState(activeCard.id, (card) => ({
        ...card,
        attachments: (card.attachments || []).map((a) => (String(a.id) === String(attId) ? { ...a, note } : a)),
      }));
      setAttachmentSaving(null);
    }
  };

  // Card Drag & Drop
  const handleCardDragStart = (cardId: string | number, fromColumnId: string | number) => {
    setDragging(true);
    dragDataRef.current = { cardId, fromColumnId };
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardDrop = async (e: React.DragEvent, targetColumnId: string | number) => {
    e.preventDefault();
    const { cardId, fromColumnId } = dragDataRef.current;
    if (!cardId || !fromColumnId || String(fromColumnId) === String(targetColumnId)) {
      setDragging(false);
      return;
    }

    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, cards: [...(col.cards || [])] }));
      const fromCol = next.find((c) => String(c.id) === String(fromColumnId));
      const toCol = next.find((c) => String(c.id) === String(targetColumnId));
      if (!fromCol || !toCol) return prev;

      const idx = fromCol.cards.findIndex((c) => String(c.id) === String(cardId));
      if (idx === -1) return prev;
      const card = fromCol.cards[idx];

      fromCol.cards.splice(idx, 1);

      const activity: Activity = {
        id: Date.now(),
        type: 'move',
        author: CURRENT_USER,
        from: fromCol.name,
        to: toCol.name,
        createdAt: new Date().toISOString(),
      };

      const movedCard: Card = {
        ...card,
        columnId: toCol.id,
        activities: [...(card.activities || []), activity],
      };

      toCol.cards.push(movedCard);
      setActiveCard((prevCard) => (prevCard && String(prevCard.id) === String(cardId) ? movedCard : prevCard));
      return next;
    });

    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: targetColumnId }),
      });
    } catch (e) {
      console.error('Move card failed', e);
      alert('Kart taşınamadı (sunucu hatası).');
    } finally {
      setDragging(false);
      dragDataRef.current = { cardId: null, fromColumnId: null };
    }
  };

  const handleCardDragEnd = () => {
    setDragging(false);
    dragDataRef.current = { cardId: null, fromColumnId: null };
  };

  // Column Drag & Drop
  const handleColumnDragStart = (columnId: string | number) => {
    setDraggingColumnId(columnId);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    if (draggingColumnId) e.preventDefault();
  };

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string | number) => {
    e.preventDefault();
    if (!draggingColumnId || draggingColumnId === targetColumnId) {
      setDraggingColumnId(null);
      return;
    }
    setColumns((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((c) => c.id === draggingColumnId);
      const toIdx = next.findIndex((c) => c.id === targetColumnId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDraggingColumnId(null);
  };

  // List Actions
  const sortColumnCards = (columnId: string | number, direction: 'asc' | 'desc') => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== columnId) return col;
        const sorted = [...(col.cards || [])].sort((a, b) => {
          const aNum = parseInt(a.orderNumber, 10);
          const bNum = parseInt(b.orderNumber, 10);
          const aIsNum = !isNaN(aNum);
          const bIsNum = !isNaN(bNum);
          if (aIsNum && bIsNum) return direction === 'asc' ? aNum - bNum : bNum - aNum;
          return direction === 'asc'
            ? String(a.orderNumber).localeCompare(String(b.orderNumber))
            : String(b.orderNumber).localeCompare(String(a.orderNumber));
        });
        return { ...col, cards: sorted };
      })
    );
    setColumnSettings((prev) => ({
      ...prev,
      [columnId]: { ...(prev[columnId] || {}), sortDirection: direction },
    }));
    setOpenListMenuId(null);
  };

  const setColumnColor = (columnId: string | number, color: string | null) => {
    setColumnSettings((prev) => ({
      ...prev,
      [columnId]: { ...(prev[columnId] || {}), color },
    }));
  };

  // Render helpers
  const renderCard = (card: Card, columnId: string | number) => {
    const attachmentCount = (card.attachments || []).length;
    return (
      <div
        key={card.id}
        draggable
        onDragStart={() => handleCardDragStart(card.id, columnId)}
        onDragEnd={handleCardDragEnd}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.dataset.delete === 'true') return;
          openCardModal(card);
        }}
        style={{
          background: '#f2f0ff',
          border: '1px solid #d8d3ff',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 8,
          cursor: 'grab',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{card.orderNumber}</div>
          <button
            data-delete="true"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCard(card.id, columnId);
            }}
            style={iconBtnStyle}
            title="Sil"
          >
            🗑️
          </button>
        </div>
        {attachmentCount > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#6b6b7a', display: 'flex', alignItems: 'center', gap: 4 }}>
            📎 {attachmentCount}
          </div>
        )}
      </div>
    );
  };

  const renderColumn = (col: Column) => {
    const settings = columnSettings[col.id] || {};
    const bg = settings.color || '#f1f2f3';
    const isMenuOpen = openListMenuId === col.id;
    const isAddCardActive = activeAddColumnId === col.id;

    return (
      <div
        key={col.id}
        draggable
        onDragStart={() => handleColumnDragStart(col.id)}
        onDragOver={handleColumnDragOver}
        onDrop={(e) => handleColumnDrop(e, col.id)}
        style={{
          background: bg,
          borderRadius: 10,
          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          padding: 10,
          width: 280,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{col.name}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={iconBtnStyle} onClick={() => setOpenListMenuId(isMenuOpen ? null : col.id)} title="List actions">
              ⋯
            </button>
            <button style={iconBtnStyle} onClick={() => handleRenameColumn(col.id, col.name)} title="Yeniden adlandır">
              ✏️
            </button>
            <button style={iconBtnStyle} onClick={() => handleDeleteColumn(col.id)} title="Sil">
              🗑️
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 36,
              right: 10,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              padding: 10,
              width: 200,
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>List actions</div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Sort by</div>
            <div style={menuItemStyle} onClick={() => sortColumnCards(col.id, 'asc')}>
              Order number (A → Z)
            </div>
            <div style={menuItemStyle} onClick={() => sortColumnCards(col.id, 'desc')}>
              Order number (Z → A)
            </div>
            <div style={{ fontSize: 12, color: '#555', margin: '8px 0 4px' }}>Change list color</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
              {colorPalette.map((c) => (
                <div
                  key={c}
                  onClick={() => setColumnColor(col.id, c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: c,
                    cursor: 'pointer',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
            <div style={menuItemStyle} onClick={() => setColumnColor(col.id, null)}>
              Remove color
            </div>
          </div>
        )}

        <div
          onDragOver={handleCardDragOver}
          onDrop={(e) => handleCardDrop(e, col.id)}
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 8,
            minHeight: 60,
            maxHeight: 500,
            overflowY: 'auto',
          }}
        >
          {(col.cards || []).map((card) => renderCard(card, col.id))}
        </div>

        <div style={{ marginTop: 8 }}>
          {!isAddCardActive ? (
            <button
              onClick={() => {
                setActiveAddColumnId(col.id);
                setNewCardText('');
              }}
              style={addBtnStyle}
            >
              + Add a card
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                value={newCardText}
                onChange={(e) => setNewCardText(e.target.value)}
                placeholder="Örn: 34932"
                style={inputStyle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCard(col.id);
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={cardSaving} onClick={() => handleAddCard(col.id)} style={primaryBtnStyle}>
                  {cardSaving ? 'Kaydediliyor...' : 'Kart ekle'}
                </button>
                <button
                  onClick={() => {
                    setActiveAddColumnId(null);
                    setNewCardText('');
                  }}
                  style={secondaryBtnStyle}
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal render
  const renderModal = () => {
    if (!activeCard) return null;

    const attachments = activeCard.attachments || [];
    const comments = activeCard.comments || [];
    const activities = activeCard.activities || [];

    return (
      <div
        onClick={closeCardModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            width: '90%',
            maxWidth: 1100,
            minHeight: 500,
            padding: 20,
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 16,
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {activeCard.orderNumber || 'Kart'}
              </div>
              <button style={iconBtnStyle} onClick={closeCardModal}>
                ✕
              </button>
            </div>



            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Description</div>
              {descriptionSaving && <span style={{ fontSize: 12, color: '#6b6b7a' }}>Kaydediliyor…</span>}
            </div>
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Add a more detailed description..."
              style={{
                width: '100%',
                minHeight: 140,
                borderRadius: 10,
                border: '1px solid #d9d9e3',
                padding: 12,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div>
              <button onClick={handleSaveDescription} style={{ ...primaryBtnStyle, padding: '10px 14px' }}>
                Kaydet
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15 }}>Attachments</div>
            <label style={{ ...primaryBtnStyle, display: 'inline-block', cursor: 'pointer', width: 'fit-content' }}>
              + Add attachment
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddAttachment(file);
                }}
              />
            </label>

            {attachments.length === 0 ? (
              <div style={{ color: '#888', fontSize: 13 }}>Henüz dosya yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attachments.map((att) => {
                  const isImage =
                    (att.type || '').startsWith('image/') ||
                    (att.url || '').startsWith('data:image/') ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.name || '');
                  const noteDraft = attachmentNotes[att.id] ?? att.note ?? '';
                  return (
                    <div
                      key={att.id}
                      style={{
                        border: '1px solid #e6e6ea',
                        borderRadius: 10,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        background: '#fafbff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 18 }}>📎</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1b3a79', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              download={att.name}
                              style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                              {att.name}
                            </a>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b6b7a' }}>
                            {formatSizeKB(att.size)} · {att.type || 'dosya'} · {formatDate(att.createdAt)}
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.name}
                          style={{ ...secondaryBtnStyle, padding: '6px 10px', fontSize: 12 }}
                        >
                          Aç / İndir
                        </a>
                      </div>

                      {isImage && (
                        <div style={{ marginTop: 4 }}>
                          <img
                            src={att.url}
                            alt={att.name}
                            style={{
                              maxHeight: 200,
                              maxWidth: '100%',
                              display: 'block',
                              objectFit: 'contain',
                              borderRadius: 8,
                              border: '1px solid #e6e6ea',
                            }}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Attachment note</div>
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setAttachmentNotes((prev) => ({ ...prev, [att.id]: e.target.value }))}
                          placeholder="Bu dosyayla ilgili not ekle"
                          style={{
                            width: '100%',
                            minHeight: 80,
                            borderRadius: 8,
                            border: '1px solid #d9d9e3',
                            padding: 8,
                            fontSize: 13,
                            resize: 'vertical',
                          }}
                        />
                        <div>
                          <button
                            onClick={() => handleSaveAttachmentNote(att.id)}
                            disabled={attachmentSaving === att.id}
                            style={{ ...primaryBtnStyle, padding: '8px 12px', fontSize: 12 }}
                          >
                            {attachmentSaving === att.id ? 'Kaydediliyor…' : 'Notu kaydet'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Comments and Activity</div>

            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  style={{ ...inputStyle, width: '100%' }}
                />
                <button onClick={handleAddComment} style={primaryBtnStyle}>
                  Add comment
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Comments</div>
              {comments.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>Henüz yorum yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.author}</div>
                      <div style={{ color: '#777', fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Activity</div>
              {activities.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>Henüz activity yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activities.map((a) => (
                    <div key={a.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                      <div style={{ fontSize: 13 }}>
                        <strong>{a.author}</strong> moved this card from {a.from} to {a.to}
                      </div>
                      <div style={{ color: '#777', fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render
  const header = (
    <div style={{ padding: '16px 24px', background: '#0f3c8c', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 12, letterSpacing: 1.4, opacity: 0.85 }}>FALCON TRANSFERS</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Falcon Board</div>
    </div>
  );

  const newColumnCard = (
    <div
      style={{
        background: '#e9ebef',
        borderRadius: 10,
        boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
        padding: 12,
        width: 280,
        flexShrink: 0,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>+ Yeni kolon ekle</div>
      <input
        value={newColumnName}
        onChange={(e) => setNewColumnName(e.target.value)}
        placeholder="Kolon adı"
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddColumn();
          }
        }}
      />
      <button
        disabled={columnSaving}
        onClick={handleAddColumn}
        style={{ ...primaryBtnStyle, marginTop: 8, width: '100%' }}
      >
        {columnSaving ? 'Ekleniyor...' : 'Kolon oluştur'}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f7' }}>
      {header}
      {loading ? (
        <div style={{ padding: 24 }}>Yükleniyor...</div>
      ) : (
        <div style={{ padding: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {columns.map(renderColumn)}
            {newColumnCard}
          </div>
        </div>
      )}
      {renderModal()}
    </div>
  );
}
