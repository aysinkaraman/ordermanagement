"use client";
import React, { useEffect, useState } from 'react';

type Card = { id: string; title: string; description?: string | null; createdAt?: string; };
type Column = { id: string; title: string; cards: Card[] };

export default function StandupPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [importing, setImporting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const boardsRes = await fetch('/api/boards');
      const boards = await boardsRes.json();
      const standup = (boards || []).find((b: any) => b.title === 'Daily Standup');
      if (!standup) {
        setColumns([]);
        setLoading(false);
        return;
      }
      const boardRes = await fetch(`/api/boards/${standup.id}`);
      const board = await boardRes.json();
      const cols = (board.columns || []).map((c: any) => ({ id: c.id, title: c.title, cards: c.cards || [] }));
      setColumns(cols);
    } catch (e: any) {
      setError(e.message || 'Failed to load standup');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const res = await fetch('/api/standup/import', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Import failed');
      await fetchBoard();
      alert('Imported latest tagged orders');
    } catch (e: any) {
      alert(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setArchiving(true);
      const res = await fetch('/api/standup/archive', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Archive failed');
      await fetchBoard();
      alert('Archived previous days');
    } catch (e: any) {
      alert(e.message || 'Archive failed');
    } finally {
      setArchiving(false);
    }
  };

  useEffect(() => { fetchBoard(); }, []);

  const todayCount = (cards: Card[]) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return cards.filter(c => { if (!c.createdAt) return false; const d = new Date(c.createdAt); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length;
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Daily Standup</h1>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button disabled={importing} onClick={handleImport} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', borderRadius: 6 }}>Fetch Tagged Orders</button>
        <button disabled={archiving} onClick={handleArchive} style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6 }}>Archive Previous Days</button>
      </div>
      <p style={{ marginTop: 8, color: '#555' }}>
        Tag→designer eşleşmesi STANDUP_TAG_MAP ile ayarlanır. Örn: { '{"gorkem":"Gorkem","reyhan":"Reyhan","busra":"Busra"}' }.
        Zaman dilimi için STANDUP_TZ_MINUTES varsayılanı Canada Eastern (-300). 
      </p>
      {error && <div style={{ marginTop: 8, color: 'red' }}>{error}</div>}
      {loading ? (
        <div style={{ marginTop: 16 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-start', overflowX: 'auto' }}>
          {columns.length === 0 && <div>No standup board yet. Click "Fetch Tagged Orders" to create it.</div>}
          {columns.map(col => (
            <div key={col.id} style={{ minWidth: 260, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ padding: 10, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                <strong>{col.title}</strong>
                <span style={{ color: '#059669', fontWeight: 600 }}>+{todayCount(col.cards)} today</span>
              </div>
              <div style={{ padding: 10, maxHeight: '70vh', overflowY: 'auto' }}>
                {col.cards.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 12 }}>No items yet</div>
                ) : (
                  col.cards.map(c => (
                    <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      {c.createdAt && <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>{new Date(c.createdAt).toLocaleString()}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
