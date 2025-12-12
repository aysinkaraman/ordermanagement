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
  message: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
};

type Card = {
  id: string | number;
  columnId: string | number;
  orderNumber: string;
  customerName?: string | null;
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: Activity[];
  createdAt?: string;
  dueDate?: string | null;
};

type Column = {
  id: string | number;
  name: string;
  cards: Card[];
};


type User = {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const [_dragging, setDragging] = useState(false);
  const dragDataRef = useRef<{ cardId: string | number | null; fromColumnId: string | number | null }>({
    cardId: null,
    fromColumnId: null,
  });

  const [draggingColumnId, setDraggingColumnId] = useState<string | number | null>(null);
  const [openListMenuId, setOpenListMenuId] = useState<string | number | null>(null);
  const [openSortMenuId, setOpenSortMenuId] = useState<string | number | null>(null);
  // Remove columnSettings and color picker, use pastel color by index
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveMode, setArchiveMode] = useState<'cards' | 'lists'>('cards');
  const [compactView] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('FALCON TRANSFERS');
  const [boardTitle, setBoardTitle] = useState('Falcon Board');
  const [editingCompanyName, setEditingCompanyName] = useState(false);
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Theme customization
  const [primaryColor, setPrimaryColor] = useState('#D97706');
  const [secondaryColor, setSecondaryColor] = useState('#92400E');
  const [showThemePicker, setShowThemePicker] = useState(false);
  
  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Board sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('member');
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);
  
  // Teams
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('member');
  
  const themePresets = [
    { name: 'Amber (Default)', primary: '#D97706', secondary: '#92400E' },
    { name: 'Blue Ocean', primary: '#0284C7', secondary: '#075985' },
    { name: 'Purple Dream', primary: '#9333EA', secondary: '#6B21A8' },
    { name: 'Green Forest', primary: '#059669', secondary: '#047857' },
    { name: 'Red Fire', primary: '#DC2626', secondary: '#991B1B' },
    { name: 'Pink Sunset', primary: '#DB2777', secondary: '#9F1239' },
    { name: 'Teal Wave', primary: '#0D9488', secondary: '#115E59' },
    { name: 'Indigo Night', primary: '#4F46E5', secondary: '#3730A3' },
  ];

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
    createdAt: apiCard.createdAt,
    dueDate: apiCard.dueDate,
  });

  const mapApiColumn = (apiCol: any): Column => ({
    id: apiCol.id,
    name: apiCol.title ?? '',
    cards: (apiCol.cards || []).map(mapApiCard),
  });

  const pastelPalette = [
    '#FFD6E0', // pink
    '#D6EFFF', // blue
    '#FFF9D6', // yellow
    '#D6FFD6', // green
    '#E0D6FF', // purple
    '#FFEFD6', // orange
    '#D6FFF6', // teal
    '#FFF6D6', // light yellow
    '#FFD6F6', // magenta
    '#D6FFF9', // aqua
  ];

  const pastelPaletteDark = [
    '#3b1f2b', // dark pink
    '#1f2b3b', // dark blue
    '#3b3b1f', // dark yellow
    '#1f3b2b', // dark green
    '#2b1f3b', // dark purple
    '#3b2b1f', // dark orange
    '#1f3b3a', // dark teal
    '#3a3b1f', // dark light yellow
    '#3b1f3a', // dark magenta
    '#1f3b39', // dark aqua
  ];

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        if (parsed?.companyLogo) {
          setCompanyLogo(parsed.companyLogo);
        }
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu="list-menu"]') && !target.closest('[data-menu="sort-menu"]')) {
        setOpenListMenuId(null);
        setOpenSortMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        let url = '/api/columns';
        if (showArchived) {
          url = `/api/columns?archived=true&mode=${archiveMode}`;
        }
        const res = await fetch(url);
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
  }, [showArchived, archiveMode]);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileName.trim()) {
      alert('Name is required');
      return;
    }
    
    setProfileSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          avatar: profileAvatar,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowProfileModal(false);
      alert('Profile updated successfully! ✅');
    } catch (e) {
      console.error('Profile update failed', e);
      alert('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      alert('Please enter a board title');
      return;
    }

    setCreatingBoard(true);
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBoardTitle, isPublic: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to create board');
      }

      const newBoard = await response.json();
      setBoards((prev) => [...prev, newBoard]);
      setNewBoardTitle('');
      alert('✅ Board created successfully!');
      
      // Switch to new board
      setCurrentBoardId(newBoard.id);
      setBoardTitle(newBoard.title);
      setCompanyLogo(localStorage.getItem('companyLogo'));
      loadBoardMembers(newBoard.id);
      setShowBoardSelector(false);
      window.location.reload();
    } catch (e: any) {
      console.error('Create board error:', e);
      alert(`❌ ${e.message || 'Failed to create board'}`);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleShareBoard = async () => {
    if (!shareEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setSharingLoading(true);
    try {
      // First, ensure we have a board - create one if needed
      let boardId = currentBoardId;
      if (!boardId) {
        const boardRes = await fetch('/api/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'My Kanban Board', isPublic: false }),
        });
        const board = await boardRes.json();
        boardId = board.id;
        setCurrentBoardId(boardId);
      }

      const response = await fetch(`/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      if (data.needsInvite && data.inviteLink) {
        // User doesn't exist - show invite link
        const shareLink = confirm(
          `✉️ ${shareEmail} needs to register first!\n\n` +
          `Share this link with them:\n${data.inviteLink}\n\n` +
          `Click OK to copy the link.`
        );
        if (shareLink) {
          navigator.clipboard.writeText(data.inviteLink);
          alert('✅ Invite link copied to clipboard!');
        }
      } else {
        alert(`✅ Successfully added ${shareEmail} to your board!`);
        if (boardId) loadBoardMembers(boardId);
      }
      setShareEmail('');
    } catch (e: any) {
      console.error('Share board error:', e);
      alert(`❌ ${e.message || 'Failed to add member'}`);
    } finally {
      setSharingLoading(false);
    }
  };

  const loadBoardMembers = async (boardId: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/members`);
      const data = await response.json();
      setBoardMembers(data);
    } catch (e) {
      console.error('Failed to load members', e);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the board?')) return;
    if (!currentBoardId) return;

    try {
      await fetch(`/api/boards/${currentBoardId}/members/${memberId}`, { method: 'DELETE' });
      alert('✅ Member removed');
      loadBoardMembers(currentBoardId);
    } catch (e: any) {
      alert('❌ Failed to remove member');
    }
  };

  // Team functions
  const loadTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (e) {
      console.error('Failed to load teams', e);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      alert('Team name is required');
      return;
    }

    setTeamSaving(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, description: teamDescription }),
      });
      const team = await res.json();
      alert(`✅ Team "${team.name}" created!`);
      setTeamName('');
      setTeamDescription('');
      loadTeams();
    } catch (e) {
      alert('❌ Failed to create team');
    } finally {
      setTeamSaving(false);
    }
  };

  const handleAddTeamMember = async (teamId: string) => {
    if (!teamEmail.trim()) {
      alert('Email is required');
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teamEmail, role: teamMemberRole }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }
      
      alert(`✅ Member added to team`);
      setTeamEmail('');
      if (selectedTeam?.id === teamId) {
        const res = await fetch(`/api/teams/${teamId}`);
        setSelectedTeam(await res.json());
      }
    } catch (e: any) {
      console.error('Add team member error:', e);
      alert(`❌ ${e.message || 'Failed to add member'}`);
    }
  };

  const handleRemoveTeamMember = async (teamId: string, memberId: string) => {
    if (!confirm('Remove this member from team?')) return;

    try {
      await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
      alert('✅ Member removed from team');
      if (selectedTeam?.id === teamId) {
        const res = await fetch(`/api/teams/${teamId}`);
        setSelectedTeam(await res.json());
      }
    } catch (e) {
      alert('❌ Failed to remove member');
    }
  };

  // Load boards list
  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data || []);
      if (data && data.length > 0 && !currentBoardId) {
        setCurrentBoardId(data[0].id);
        setBoardTitle(data[0].title || 'Falcon Board');
        setCompanyLogo(localStorage.getItem('companyLogo'));
        loadBoardMembers(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load boards', e);
    }
  };

  // Load current board and teams on mount
  useEffect(() => {
    loadBoards();
    loadTeams();
  }, []);

  const handleArchiveColumn = async (columnId: string | number) => {
    if (!window.confirm('Are you sure you want to archive this list? All cards will be archived too.')) return;
    try {
      await fetch(`/api/columns/${columnId}`, { method: 'DELETE' });
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      if (openListMenuId === columnId) setOpenListMenuId(null);
    } catch (e) {
      console.error('Archive column failed', e);
      alert('List could not be archived.');
    }
  };

  const handleUnarchiveColumn = async (columnId: string | number) => {
    try {
      await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (e) {
      console.error('Unarchive column failed', e);
      alert('List could not be unarchived.');
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

  const handleArchiveCard = async (cardId: string | number, columnId: string | number) => {
    if (!window.confirm('Are you sure you want to archive this card?')) return;
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
      console.error('Archive card failed', e);
      alert('Card could not be archived.');
    }
  };

  const handleUnarchiveCard = async (cardId: string | number, columnId: string | number) => {
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId
            ? { ...c, cards: (c.cards || []).filter((card) => card.id !== cardId) }
            : c
        )
      );
    } catch (e) {
      console.error('Unarchive card failed', e);
      alert('Card could not be unarchived.');
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
        message: `Card moved from "${fromCol.name}" to "${toCol.name}"`,
        createdAt: new Date().toISOString(),
        user: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || null,
        } : null,
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
  const sortColumnCards = (columnId: string | number, sortType: 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest') => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== columnId) return col;
        const sorted = [...(col.cards || [])].sort((a, b) => {
          switch (sortType) {
            case 'name-asc':
            case 'name-desc': {
              // Sort by card name (orderNumber)
              const aNum = parseInt(a.orderNumber, 10);
              const bNum = parseInt(b.orderNumber, 10);
              const aIsNum = !isNaN(aNum);
              const bIsNum = !isNaN(bNum);
              if (aIsNum && bIsNum) {
                return sortType === 'name-asc' ? aNum - bNum : bNum - aNum;
              }
              const comparison = String(a.orderNumber).localeCompare(String(b.orderNumber));
              return sortType === 'name-asc' ? comparison : -comparison;
            }
            case 'date-newest':
            case 'date-oldest': {
              // Sort by creation date - note: cards don't have createdAt in Card type yet
              // For now, sort by order which represents creation order
              return sortType === 'date-newest' 
                ? (b.id as string).localeCompare(a.id as string)
                : (a.id as string).localeCompare(b.id as string);
            }
            default:
              return 0;
          }
        });
        return { ...col, cards: sorted };
      })
    );
    setOpenListMenuId(null);
  };


  // Render helpers
  const renderCard = (card: Card, columnId: string | number) => {
    const attachmentCount = (card.attachments || []).length;
    const cardAttachments = card.attachments || [];
    
    // Collect card labels for display
    const cardLabels: string[] = [];
    cardAttachments.forEach((att: any) => {
      if (att.labels && Array.isArray(att.labels)) {
        att.labels.forEach((l: string) => {
          if (!cardLabels.includes(l)) cardLabels.push(l);
        });
      }
    });
    
    return (
      <div
        key={card.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          handleCardDragStart(card.id, columnId);
        }}
        onDragEnd={handleCardDragEnd}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.dataset.delete === 'true') return;
          openCardModal(card);
        }}
        style={{
          background: globalSearch ? '#FEF3C7' : '#f2f0ff',
          border: globalSearch ? `2px solid ${primaryColor}` : '1px solid #d8d3ff',
          borderRadius: 8,
          padding: compactView ? '6px 8px' : '10px 12px',
          marginBottom: compactView ? 4 : 8,
          cursor: 'grab',
          boxShadow: globalSearch ? '0 2px 8px rgba(217, 119, 6, 0.3)' : '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: compactView ? 12 : 13 }}>{card.orderNumber}</div>
          {!showArchived && (
            <button
              data-delete="true"
              onClick={(e) => {
                e.stopPropagation();
                handleArchiveCard(card.id, columnId);
              }}
              style={iconBtnStyle}
              title="Archive"
            >
              📂
            </button>
          )}
          {showArchived && (
            <button
              data-delete="true"
              onClick={(e) => {
                e.stopPropagation();
                handleUnarchiveCard(card.id, columnId);
              }}
              style={iconBtnStyle}
              title="Restore"
            >
              ↩️
            </button>
          )}
        </div>
        {!compactView && cardLabels.length > 0 && (
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cardLabels.map(label => (
              <span key={label} style={{ 
                fontSize: 10, 
                padding: '2px 6px', 
                background: '#e0e7ff', 
                color: '#4338ca',
                borderRadius: 4,
                fontWeight: 500
              }}>
                {label}
              </span>
            ))}
          </div>
        )}
        {!compactView && attachmentCount > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#6b6b7a', display: 'flex', alignItems: 'center', gap: 4 }}>
            📎 {attachmentCount}
          </div>
        )}
      </div>
    );
  };

  const renderColumn = (col: Column) => {
    const isMenuOpen = openListMenuId === col.id;
    const isAddCardActive = activeAddColumnId === col.id;

    return (
      <div
        key={col.id}
        onDragOver={handleColumnDragOver}
        onDrop={(e) => handleColumnDrop(e, col.id)}
        style={{
          background: (darkMode ? pastelPaletteDark : pastelPalette)[(columns.findIndex(c => c.id === col.id)) % pastelPalette.length],
          borderRadius: 10,
          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          padding: compactView ? 8 : 10,
          width: compactView ? 250 : 280,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div 
          draggable={!showArchived}
          onDragStart={(e) => {
            if (showArchived) return;
            e.stopPropagation();
            handleColumnDragStart(col.id);
          }}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8,
            cursor: !showArchived ? 'grab' : 'default'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: compactView ? 13 : 14 }}>{col.name}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {!showArchived && (
              <>
                <button style={iconBtnStyle} onClick={() => setOpenListMenuId(isMenuOpen ? null : col.id)} title="List actions">
                  ⋯
                </button>
                <button style={iconBtnStyle} onClick={() => handleRenameColumn(col.id, col.name)} title="Rename">
                  ✏️
                </button>
                <button style={iconBtnStyle} onClick={() => handleArchiveColumn(col.id)} title="Archive list">
                  📂
                </button>
              </>
            )}
            {showArchived && (
              <button style={iconBtnStyle} onClick={() => handleUnarchiveColumn(col.id)} title="Restore list">
                ↩️
              </button>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div
            data-menu="list-menu"
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
            <div 
              style={{ ...menuItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
              onClick={(e) => {
                e.stopPropagation();
                setOpenSortMenuId(openSortMenuId === col.id ? null : col.id);
              }}
            >
              Sort by...
              <span style={{ fontSize: 10 }}>▶</span>
            </div>
          </div>
        )}

        {openSortMenuId === col.id && (
          <div
            data-menu="sort-menu"
            style={{
              position: 'absolute',
              top: 36,
              right: 220,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              padding: 10,
              width: 220,
              zIndex: 11,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Sort list</div>
            {/* Türkçe: A'dan Z'ye ve Z'den A'ya en üste alındı */}
            <div style={menuItemStyle} onClick={() => { sortColumnCards(col.id, 'name-asc'); setOpenSortMenuId(null); }}>
              Card name (A → Z)
            </div>
            <div style={menuItemStyle} onClick={() => { sortColumnCards(col.id, 'name-desc'); setOpenSortMenuId(null); }}>
              Card name (Z → A)
            </div>
            <div style={menuItemStyle} onClick={() => { sortColumnCards(col.id, 'date-newest'); setOpenSortMenuId(null); }}>
              Date created (newest first)
            </div>
            <div style={menuItemStyle} onClick={() => { sortColumnCards(col.id, 'date-oldest'); setOpenSortMenuId(null); }}>
              Date created (oldest first)
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        {!showArchived && (() => {
          const stats = getColumnStats(col.cards || []);
          const completionRate = stats.withDueDate > 0 
            ? ((stats.withDueDate - stats.overdue) / stats.withDueDate) * 100 
            : 100;
          
          return (
            <div style={{ 
              background: 'rgba(255,255,255,0.7)', 
              borderRadius: 6, 
              padding: 8, 
              marginBottom: 8,
              fontSize: 11
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#666', fontWeight: 600 }}>📊 {stats.total} cards</span>
                {stats.addedToday > 0 && (
                  <span style={{ color: '#059669', fontWeight: 600 }}>+{stats.addedToday} today</span>
                )}
              </div>
              
              {stats.overdue > 0 && (
                <div style={{ 
                  color: '#DC2626', 
                  fontWeight: 600,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  ⚠️ {stats.overdue} overdue
                </div>
              )}
              
              {stats.withDueDate > 0 && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 2,
                    color: '#666',
                    fontSize: 10
                  }}>
                    <span>Completion</span>
                    <span>{Math.round(completionRate)}%</span>
                  </div>
                  <div style={{ 
                    background: '#E5E7EB', 
                    borderRadius: 4, 
                    height: 6,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: completionRate > 75 ? '#059669' : completionRate > 50 ? '#F59E0B' : '#DC2626',
                      height: '100%',
                      width: `${completionRate}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div
          onDragOver={handleCardDragOver}
          onDrop={(e) => handleCardDrop(e, col.id)}
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 8,
            minHeight: 60,
            maxHeight: '70dvh',
            overflowY: 'auto',
          }}
        >
          {(col.cards || [])
            .filter(card => {
              if (!filterLabel) return true;
              const cardAttachments = card.attachments || [];
              const cardLabels: string[] = [];
              cardAttachments.forEach((att: any) => {
                if (att.labels && Array.isArray(att.labels)) {
                  att.labels.forEach((l: string) => {
                    if (!cardLabels.includes(l)) cardLabels.push(l);
                  });
                }
              });
              return cardLabels.includes(filterLabel);
            })
            .map((card) => renderCard(card, col.id))
          }
        </div>

        {!showArchived && (
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
                  placeholder="E.g: 34932"
                  style={inputStyle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCard(col.id);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button disabled={cardSaving} onClick={() => handleAddCard(col.id)} style={{...primaryBtnStyle, background: primaryColor}}>
                    {cardSaving ? 'Saving...' : 'Add card'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveAddColumnId(null);
                      setNewCardText('');
                    }}
                    style={secondaryBtnStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
                {activeCard.orderNumber || 'Card'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!showArchived && (
                  <button
                    style={{ ...iconBtnStyle, fontSize: 16 }}
                    onClick={() => {
                      handleArchiveCard(activeCard.id, activeCard.columnId);
                      closeCardModal();
                    }}
                    title="Archive card"
                  >
                    📂
                  </button>
                )}
                {showArchived && (
                  <button
                    style={{ ...iconBtnStyle, fontSize: 16 }}
                    onClick={() => {
                      handleUnarchiveCard(activeCard.id, activeCard.columnId);
                      closeCardModal();
                    }}
                    title="Restore card"
                  >
                    ↩️
                  </button>
                )}
                <button style={iconBtnStyle} onClick={closeCardModal}>
                  ✕
                </button>
              </div>
            </div>



            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Description</div>
              {descriptionSaving && <span style={{ fontSize: 12, color: '#6b6b7a' }}>Saving…</span>}
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
                Save
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
              <div style={{ color: '#888', fontSize: 13 }}>No files yet.</div>
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
                            {formatSizeKB(att.size)} · {att.type || 'file'} · {formatDate(att.createdAt)}
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.name}
                          style={{ ...secondaryBtnStyle, padding: '6px 10px', fontSize: 12 }}
                        >
                          Open / Download
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
                          placeholder="Add a note about this file"
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
                            {attachmentSaving === att.id ? 'Saving…' : 'Save note'}
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
                <button onClick={handleAddComment} style={{...primaryBtnStyle, background: primaryColor}}>
                  Add comment
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Comments</div>
              {comments.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>No comments yet.</div>
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
                <div style={{ color: '#888', fontSize: 13 }}>No activity yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activities.map((a) => (
                    <div key={a.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 8, display: 'flex', gap: 10, alignItems: 'start' }}>
                      {/* User Avatar */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: a.user?.avatar && a.user.avatar.startsWith('data:')
                          ? '#fff'
                          : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: a.user?.avatar && a.user.avatar.startsWith('data:') ? 0 : 14,
                        fontWeight: 'bold',
                        color: '#fff',
                        flexShrink: 0,
                        overflow: 'hidden',
                        backgroundImage: a.user?.avatar && a.user.avatar.startsWith('data:')
                          ? `url(${a.user.avatar})`
                          : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}>
                        {(!a.user?.avatar || !a.user.avatar.startsWith('data:')) && (
                          a.user?.avatar || a.user?.name.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      
                      {/* Activity Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <strong style={{ color: primaryColor }}>
                            {a.user?.name || 'Unknown User'}
                          </strong>
                          {' '}
                          {a.message}
                        </div>
                        <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                      </div>
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
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCompanyLogo(dataUrl);
      localStorage.setItem('companyLogo', dataUrl);
    };
    reader.readAsDataURL(file);

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleCompanyNameSave = () => {
    setEditingCompanyName(false);
    localStorage.setItem('companyName', companyName);
  };

  const handleBoardTitleSave = () => {
    setEditingBoardTitle(false);
    localStorage.setItem('boardTitle', boardTitle);
  };

  // Load branding and theme from localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    const savedCompanyName = localStorage.getItem('companyName');
    const savedBoardTitle = localStorage.getItem('boardTitle');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedSecondaryColor = localStorage.getItem('secondaryColor');
    
    if (!companyLogo && savedLogo) setCompanyLogo(savedLogo);
    if (savedCompanyName) setCompanyName(savedCompanyName);
    if (savedBoardTitle) setBoardTitle(savedBoardTitle);
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);
  }, []);
  
  const applyTheme = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    localStorage.setItem('primaryColor', primary);
    localStorage.setItem('secondaryColor', secondary);
  };

  // Calculate stats for a column
  const getColumnStats = (cards: Card[]) => {
    const total = cards.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const addedToday = cards.filter(card => {
      if (!card.createdAt) return false;
      const cardDate = new Date(card.createdAt);
      cardDate.setHours(0, 0, 0, 0);
      return cardDate.getTime() === today.getTime();
    }).length;
    
    const overdue = cards.filter(card => {
      if (!card.dueDate) return false;
      return new Date(card.dueDate) < new Date();
    }).length;
    
    const withDueDate = cards.filter(card => card.dueDate).length;
    
    return { total, addedToday, overdue, withDueDate };
  };

  const header = (
    <div style={{ padding: compactView ? '10px 16px' : '16px 24px', background: darkMode ? '#111827' : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Company Logo */}
        <div 
          onClick={() => logoInputRef.current?.click()}
          style={{ 
            width: 60, 
            height: 60, 
            background: companyLogo ? 'transparent' : 'rgba(255,255,255,0.2)', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            overflow: 'hidden',
            flexShrink: 0
          }}
          title="Click to upload logo"
        >
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 24 }}>🏢</span>
          )}
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />

        {/* Company Name & Board Title */}
        <div>
          {editingCompanyName ? (
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value.toUpperCase())}
              onBlur={handleCompanyNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCompanyNameSave();
                if (e.key === 'Escape') {
                  setCompanyName(localStorage.getItem('companyName') || 'FALCON TRANSFERS');
                  setEditingCompanyName(false);
                }
              }}
              autoFocus
              style={{ 
                fontSize: 12, 
                letterSpacing: 1.4, 
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#FEF3C7',
                outline: 'none',
                fontWeight: 600
              }}
            />
          ) : (
            <div 
              onClick={() => setEditingCompanyName(true)}
              style={{ 
                fontSize: 12, 
                letterSpacing: 1.4, 
                opacity: 0.95, 
                color: '#FEF3C7',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Click to edit"
            >
              {companyName}
            </div>
          )}
          
          {editingBoardTitle ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleBoardTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBoardTitleSave();
                if (e.key === 'Escape') {
                  setBoardTitle(localStorage.getItem('boardTitle') || 'Falcon Board');
                  setEditingBoardTitle(false);
                }
              }}
              autoFocus
              style={{ 
                fontSize: 22, 
                fontWeight: 700,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#FFFFFF',
                outline: 'none'
              }}
            />
          ) : (
            <div 
              onClick={() => setEditingBoardTitle(true)}
              style={{ 
                fontSize: 22, 
                fontWeight: 700, 
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Click to edit"
            >
              {boardTitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Global Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="🔍 Search cards..."
            style={{
              padding: '6px 10px 6px 28px',
              borderRadius: 5,
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
              width: globalSearch ? '220px' : '160px',
              transition: 'width 0.3s ease, background 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onBlur={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Compact View enforced: toggle removed */}

        {/* Label Filter */}
        {!showArchived && (() => {
          const allLabels = new Set<string>();
          columns.forEach(col => {
            col.cards.forEach(card => {
              const cardAttachments = card.attachments || [];
              cardAttachments.forEach((att: any) => {
                if (att.labels && Array.isArray(att.labels)) {
                  att.labels.forEach((l: string) => allLabels.add(l));
                }
              });
            });
          });
          
          if (allLabels.size > 0) {
            return (
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: filterLabel ? '#FEF3C7' : 'rgba(255,255,255,0.2)',
                  color: filterLabel ? '#92400E' : '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <option value="" style={{ color: '#333' }}>🏷️ All Labels</option>
                {Array.from(allLabels).map(label => (
                  <option key={label} value={label} style={{ color: '#333' }}>{label}</option>
                ))}
              </select>
            );
          }
          return null;
        })()}

        {/* Teams */}
        <button
          onClick={() => setShowTeamModal(!showTeamModal)}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: 'rgba(168, 85, 247, 0.9)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Manage teams"
        >
          🏢 Teams
        </button>

        {/* Board Selector */}
        <button
          onClick={() => setShowBoardSelector(!showBoardSelector)}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Switch between boards"
        >
          📋 My Boards ({boards.length})
        </button>

        {/* Share Board */}
        <button
          onClick={() => setShowShareModal(!showShareModal)}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: 'rgba(59, 130, 246, 0.9)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Share this board with team members"
        >
          👥 Share Board
        </button>

        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: darkMode ? (showThemePicker ? '#374151' : '#1f2937') : (showThemePicker ? '#FEF3C7' : 'rgba(255,255,255,0.2)'),
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Customize Theme"
        >
          🎨 Theme
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: darkMode ? '#111827' : 'rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Toggle dark mode"
        >
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Import Shopify Orders button removed: handled by webhook */}

        <button
          onClick={() => {
            setShowArchived(!showArchived);
            setSearchQuery('');
            setArchiveMode('cards');
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 5,
            border: 'none',
            background: showArchived ? '#FEF3C7' : 'rgba(255,255,255,0.2)',
            color: showArchived ? '#92400E' : '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          📂 Archived Items
        </button>

        {/* User Profile & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
            <div
              onClick={() => {
                setProfileName(currentUser.name);
                setProfileAvatar(currentUser.avatar || '');
                setShowProfileModal(true);
              }}
              style={{
                cursor: 'pointer',
                padding: '2px',
                borderRadius: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Click to edit profile"
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentUser.avatar && currentUser.avatar.startsWith('data:')
                  ? '#fff'
                  : 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: currentUser.avatar && currentUser.avatar.startsWith('data:') ? 0 : 13,
                fontWeight: 'bold',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.5)',
                overflow: 'hidden',
                backgroundImage: currentUser.avatar && currentUser.avatar.startsWith('data:')
                  ? `url(${currentUser.avatar})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
                {(!currentUser.avatar || !currentUser.avatar.startsWith('data:')) && (currentUser.avatar || currentUser.name.charAt(0).toUpperCase())}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
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
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>+ Create list</div>
      <input
        value={newColumnName}
        onChange={(e) => setNewColumnName(e.target.value)}
        placeholder="List name"
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
        {columnSaving ? 'Creating...' : 'Create list'}
      </button>
    </div>
  );

  // Filter columns and cards based on search query
  // Global search filtering (for main board)
  const globalFilteredColumns = globalSearch.trim()
    ? columns.map((col) => ({
        ...col,
        cards: col.cards.filter(
          (card) => {
            const query = globalSearch.toLowerCase().trim();
            const orderNum = String(card.orderNumber || '').toLowerCase().trim();
            const custName = String(card.customerName || '').toLowerCase().trim();
            
            // Search in attachments and comments
            const hasMatchInAttachments = (card.attachments || []).some(att => 
              String(att.name || '').toLowerCase().includes(query)
            );
            const hasMatchInComments = (card.comments || []).some(comment => 
              String(comment.text || '').toLowerCase().includes(query)
            );
            
            return orderNum.includes(query) || 
                   custName.includes(query) || 
                   hasMatchInAttachments || 
                   hasMatchInComments;
          }
        ),
      }))
    : columns;

  // Render archived cards as a list (Trello style)
  const renderArchivedView = () => {
    if (archiveMode === 'lists') {
      // Show archived lists
      const archivedLists = columns.filter((col) => searchQuery.trim()
        ? col.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      );

      return (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#666' }}>
            {archivedLists.length} list{archivedLists.length !== 1 ? 's' : ''}
          </div>
          {archivedLists.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
              {searchQuery ? 'No lists match your search' : 'No archived lists'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {archivedLists.map((col) => (
                <div
                  key={col.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                      {col.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {col.cards.length} card{col.cards.length !== 1 ? 's' : ''} · Archived
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnarchiveColumn(col.id)}
                    style={{
                      ...secondaryBtnStyle,
                      padding: '6px 12px',
                      fontSize: 12,
                    }}
                  >
                    ↩️ Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Show archived cards
    const allArchivedCards: Array<Card & { columnName: string }> = [];
    columns.forEach((col) => {
      col.cards.forEach((card) => {
        allArchivedCards.push({ ...card, columnName: col.name });
      });
    });

    const filtered = searchQuery.trim()
      ? allArchivedCards.filter((card) => {
          const query = searchQuery.toLowerCase().trim();
          const orderNum = String(card.orderNumber || '').toLowerCase().trim();
          const custName = String(card.customerName || '').toLowerCase().trim();
          return orderNum.includes(query) || custName.includes(query);
        })
      : allArchivedCards;

    return (
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#666' }}>
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No cards match your search' : 'No archived cards'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((card) => (
              <div
                key={card.id}
                onClick={() => openCardModal(card)}
                style={{
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    {card.orderNumber}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {card.columnName} · Archived
                  </div>
                  {card.customerName && (
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                      {card.customerName}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchiveCard(card.id, card.columnId);
                  }}
                  style={{
                    ...secondaryBtnStyle,
                    padding: '6px 12px',
                    fontSize: 12,
                  }}
                >
                  ↩️ Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render archive drawer (sidebar)
  const renderArchiveDrawer = () => {
    if (!showArchived) return null;

    return (
      <>
        {/* Overlay */}
        <div
          onClick={() => setShowArchived(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
        {/* Drawer */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '600px',
            maxWidth: '90vw',
            background: '#fff',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>Archived Items</div>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#666',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Search and toggle */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={archiveMode === 'cards' ? 'Search archived cards...' : 'Search archived lists...'}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #d0d0d0',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={() => setArchiveMode(archiveMode === 'cards' ? 'lists' : 'cards')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #d0d0d0',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Switch to {archiveMode === 'cards' ? 'lists' : 'cards'}
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>
            ) : (
              renderArchivedView()
            )}
          </div>
        </div>
      </>
    );
  };

  // Theme Picker Modal
  const renderThemePicker = () => {
    if (!showThemePicker) return null;
    
    return (
      <div
        onClick={() => setShowThemePicker(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333', margin: 0 }}>🎨 Customize Theme</h2>
            <button
              onClick={() => setShowThemePicker(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ×
            </button>
          </div>

          {/* Custom Colors */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 12 }}>Custom Colors</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Primary Color</label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => applyTheme(e.target.value, secondaryColor)}
                  style={{
                    width: '100%',
                    height: 50,
                    border: '2px solid #ddd',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Secondary Color</label>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => applyTheme(primaryColor, e.target.value)}
                  style={{
                    width: '100%',
                    height: 50,
                    border: '2px solid #ddd',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preset Themes */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 12 }}>Preset Themes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {themePresets.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => applyTheme(preset.primary, preset.secondary)}
                  style={{
                    background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    border: primaryColor === preset.primary && secondaryColor === preset.secondary ? '3px solid #333' : '3px solid transparent',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    {preset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>Preview</h3>
            <div style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              padding: 16,
              borderRadius: 8,
              color: '#fff',
              textAlign: 'center',
              fontWeight: 600
            }}>
              Your Board Header
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile Modal
  const renderProfileModal = () => {
    if (!showProfileModal) return null;

    return (
      <div 
        onClick={() => setShowProfileModal(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 16,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            color: '#fff',
            borderRadius: '16px 16px 0 0',
          }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>👤 Edit Profile</h2>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24 }}>
            {/* Current Avatar Preview */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: profileAvatar && profileAvatar.startsWith('data:') 
                  ? '#fff' 
                  : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: profileAvatar && profileAvatar.startsWith('data:') ? 0 : 48,
                fontWeight: 'bold',
                color: '#fff',
                border: '4px solid #e5e7eb',
                marginBottom: 12,
                overflow: 'hidden',
                backgroundImage: profileAvatar && profileAvatar.startsWith('data:') 
                  ? `url(${profileAvatar})` 
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
                {(!profileAvatar || !profileAvatar.startsWith('data:')) && (profileAvatar || profileName.charAt(0).toUpperCase())}
              </div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                Profile Avatar
              </div>
              <label
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: primaryColor,
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                📷 Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert('File size must be less than 2MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfileAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              {profileAvatar && profileAvatar.startsWith('data:') && (
                <button
                  onClick={() => setProfileAvatar('')}
                  style={{
                    display: 'inline-block',
                    marginLeft: 8,
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  🗑️ Remove
                </button>
              )}
            </div>

            {/* Name Field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                marginBottom: 8,
              }}>
                Name *
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Avatar Field - Only show if no photo uploaded */}
            {(!profileAvatar || !profileAvatar.startsWith('data:')) && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: 8,
                  }}>
                    Avatar (Emoji)
                  </label>
                  <input
                    type="text"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="e.g., 👨‍💼 👩‍💼 🦅 🚀"
                    maxLength={2}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = primaryColor}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                    Enter an emoji, upload a photo, or leave empty to use your initial
                  </p>
                </div>

                {/* Emoji Suggestions */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#666',
                    marginBottom: 8,
                  }}>
                    Quick Pick:
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['👨‍💼', '👩‍💼', '🦅', '🚀', '⭐', '💼', '👔', '🎯', '💪', '🔥'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setProfileAvatar(emoji)}
                        style={{
                          fontSize: 24,
                          padding: '8px 12px',
                          border: profileAvatar === emoji ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                          borderRadius: 8,
                          background: profileAvatar === emoji ? `${primaryColor}20` : '#f9f9f9',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowProfileModal(false)}
                disabled={profileSaving}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  background: '#fff',
                  color: '#666',
                  cursor: profileSaving ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={profileSaving || !profileName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  background: profileSaving || !profileName.trim() ? '#ccc' : primaryColor,
                  color: '#fff',
                  cursor: profileSaving || !profileName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {profileSaving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', background: darkMode ? '#0b0f14' : '#f6f6f7', display: 'flex', flexDirection: 'column' }}>
      {header}
      {loading ? (
        <div style={{ padding: 24 }}>Loading...</div>
      ) : (
        <>
          {globalSearch && (
            <div style={{ 
              padding: '12px 24px', 
              background: '#fff', 
              borderBottom: '1px solid #e5e7eb',
              color: '#666',
              fontSize: 13
            }}>
              🔍 Searching for: <strong>{globalSearch}</strong>
              {globalFilteredColumns.reduce((sum, col) => sum + col.cards.length, 0) === 0 && (
                <span style={{ color: '#DC2626', marginLeft: 8 }}>No results found</span>
              )}
            </div>
          )}
          <div style={{ padding: 16, overflowX: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', height: '100%' }}>
              {globalFilteredColumns.map(renderColumn)}
              {!globalSearch && newColumnCard}
            </div>
          </div>
        </>
      )}
      {renderModal()}
      {renderArchiveDrawer()}
      {renderThemePicker()}
      {renderProfileModal()}
      {renderBoardSelector()}
      {renderShareModal()}
      {renderTeamModal()}
    </div>
  );

  function renderBoardSelector() {
    if (!showBoardSelector) return null;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => setShowBoardSelector(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 My Boards</h2>
            <button onClick={() => setShowBoardSelector(false)} style={{ ...iconBtnStyle, fontSize: 20 }}>✕</button>
          </div>

          {/* Create New Board */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '2px dashed #3b82f6' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#1e40af' }}>
              ➕ Create New Board
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board title..."
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              />
              <button
                onClick={handleCreateBoard}
                disabled={creatingBoard || !newBoardTitle.trim()}
                style={{
                  ...primaryBtnStyle,
                  opacity: creatingBoard || !newBoardTitle.trim() ? 0.5 : 1,
                  cursor: creatingBoard || !newBoardTitle.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {creatingBoard ? '⏳' : '➕ Create'}
              </button>
            </div>
          </div>

          {/* Boards List */}
          <div style={{ display: 'grid', gap: 12 }}>
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => {
                  setCurrentBoardId(board.id);
                  setBoardTitle(board.title || 'Falcon Board');
                  setCompanyLogo(board.logo || null);
                  loadBoardMembers(board.id);
                  setShowBoardSelector(false);
                  // Reload board data
                  window.location.reload();
                }}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: currentBoardId === board.id ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                  background: currentBoardId === board.id ? '#fef3c7' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentBoardId !== board.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentBoardId !== board.id) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                    {board.title || 'Untitled Board'}
                  </h3>
                  {currentBoardId === board.id && (
                    <span style={{ 
                      background: primaryColor, 
                      color: '#fff', 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 11, 
                      fontWeight: 600 
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>📊 {board._count?.columns || 0} lists</span>
                  <span>👥 {board._count?.members || 0} members</span>
                  <span>🗓️ Created {new Date(board.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {boards.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <p style={{ fontSize: 14 }}>No boards yet. Create your first board!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderShareModal() {
    if (!showShareModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={() => setShowShareModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 500,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>👥 Share Board</h2>
          <button onClick={() => setShowShareModal(false)} style={{ ...iconBtnStyle, fontSize: 20 }}>✕</button>
        </div>

        {/* Add Member Form */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Add Member by Email
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="user@example.com"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleShareBoard()}
            />
            <select
              value={shareRole}
              onChange={(e) => setShareRole(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleShareBoard}
            disabled={sharingLoading || !shareEmail.trim()}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: sharingLoading || !shareEmail.trim() ? '#ccc' : primaryColor,
              color: '#fff',
              cursor: sharingLoading || !shareEmail.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {sharingLoading ? 'Adding...' : '➕ Add Member'}
          </button>
        </div>

        {/* Members List */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>
            Board Members ({boardMembers.length})
          </h3>
          {boardMembers.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
              No members yet. Add someone to collaborate!
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {boardMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    background: '#f9f9f9',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: primaryColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{member.user.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{member.user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        background: '#e5e7eb',
                        borderRadius: 4,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 4,
                          border: 'none',
                          background: '#fee',
                          color: '#c00',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ 
          marginTop: 20, 
          padding: 12, 
          background: '#eff6ff', 
          borderRadius: 8, 
          fontSize: 13, 
          color: '#1e40af' 
        }}>
          💡 <strong>Tip:</strong> Members can view and edit all cards. Admins can also manage members.
        </div>
      </div>
    </div>
  );
  }

  function renderTeamModal() {
    if (!showTeamModal) return null;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => { setShowTeamModal(false); setSelectedTeam(null); }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🏢 Teams</h2>
            <button onClick={() => { setShowTeamModal(false); setSelectedTeam(null); }} style={{ ...iconBtnStyle, fontSize: 20 }}>✕</button>
          </div>

          {!selectedTeam ? (
            <>
              {/* Create Team Form */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create New Team</h3>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team name (e.g., Marketing Team)"
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Team description (optional)"
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={teamSaving || !teamName.trim()}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: teamSaving || !teamName.trim() ? '#ccc' : primaryColor,
                    color: '#fff',
                    cursor: teamSaving || !teamName.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {teamSaving ? 'Creating...' : '➕ Create Team'}
                </button>
              </div>

              {/* Teams List */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Your Teams ({teams.length})</h3>
                {teams.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
                    No teams yet. Create your first team above!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        style={{
                          padding: 16,
                          background: '#f9fafb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.borderColor = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>{team.name}</div>
                            {team.description && (
                              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{team.description}</div>
                            )}
                            <div style={{ fontSize: 12, color: '#999' }}>
                              👥 {team._count.members} members · 📋 {team._count.boards} boards
                            </div>
                          </div>
                          <div style={{ fontSize: 20 }}>→</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Team Details */}
              <button
                onClick={() => setSelectedTeam(null)}
                style={{ ...secondaryBtnStyle, marginBottom: 16, padding: '6px 12px', fontSize: 13 }}
              >
                ← Back to Teams
              </button>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedTeam.name}</h3>
                {selectedTeam.description && (
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>{selectedTeam.description}</p>
                )}
              </div>

              {/* Add Member */}
              <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Add Team Member</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    placeholder="user@example.com"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={teamMemberRole}
                    onChange={(e) => setTeamMemberRole(e.target.value)}
                    style={{ ...inputStyle, width: 120 }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={() => handleAddTeamMember(selectedTeam.id)}
                  disabled={!teamEmail.trim()}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: '8px',
                    borderRadius: 6,
                    border: 'none',
                    background: !teamEmail.trim() ? '#ccc' : primaryColor,
                    color: '#fff',
                    cursor: !teamEmail.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ➕ Add Member
                </button>
              </div>

              {/* Members List */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Members ({selectedTeam.members?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedTeam.members || []).map((member: any) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: primaryColor,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{member.user.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{member.user.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '3px 6px',
                            background: '#e5e7eb',
                            borderRadius: 3,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {member.role}
                        </span>
                        {member.user.id !== selectedTeam.ownerId && (
                          <button
                            onClick={() => handleRemoveTeamMember(selectedTeam.id, member.id)}
                            style={{
                              padding: '3px 6px',
                              fontSize: 11,
                              borderRadius: 3,
                              border: 'none',
                              background: '#fee',
                              color: '#c00',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boards */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Team Boards ({selectedTeam.boards?.length || 0})</h4>
                {(selectedTeam.boards || []).length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', color: '#999', fontSize: 13, background: '#f9fafb', borderRadius: 6 }}>
                    No boards yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selectedTeam.boards || []).map((board: any) => (
                      <div
                        key={board.id}
                        style={{
                          padding: 10,
                          background: '#f9fafb',
                          borderRadius: 6,
                          fontSize: 13,
                        }}
                      >
                        📋 {board.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
