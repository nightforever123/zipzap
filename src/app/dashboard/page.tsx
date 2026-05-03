"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  isVerified: boolean;
}

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777", "#0891b2", "#4f46e5"];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) { router.push("/login"); return; }
    const data = await res.json();
    if (!data.user.isVerified) { router.push("/verify"); return; }
    setUser(data.user);
  }, [router]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchNotes();
  }, [fetchUser, fetchNotes]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const openCreate = () => {
    setEditNote(null);
    setTitle("");
    setContent("");
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setShowModal(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      if (editNote) {
        const res = await fetch(`/api/notes/${editNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, color }),
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(prev => prev.map(n => n.id === editNote.id ? data.note : n));
        }
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, color }),
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(prev => [data.note, ...prev]);
        }
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-indigo-900/10" />

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NotesApp
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === "developer" && (
              <button
                onClick={() => router.push("/admin")}
                className="text-sm px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all"
              >
                ⚡ Панель
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user?.nickname}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Мои заметки</h2>
            <p className="text-slate-500 text-sm mt-1">{notes.length} {notes.length === 1 ? "заметка" : notes.length < 5 ? "заметки" : "заметок"}</p>
          </div>
          <button onClick={openCreate} className="btn-primary text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Новая заметка
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">📒</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Пока пусто</h3>
            <p className="text-slate-500">Создайте свою первую заметку!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className="glass glass-hover rounded-2xl p-5 card-hover animate-fade-in cursor-pointer group"
                style={{ animationDelay: `${index * 0.05}s`, borderLeft: `3px solid ${note.color}` }}
                onClick={() => openEdit(note)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-100 line-clamp-1 flex-1">{note.title}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 -mr-1 -mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-slate-400 line-clamp-3 whitespace-pre-wrap">{note.content || "Пустая заметка"}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(note.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-6">
              {editNote ? "Редактировать заметку" : "Новая заметка"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Заголовок</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 transition-all"
                  placeholder="Название заметки..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Содержание</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 transition-all resize-none h-36"
                  placeholder="Текст заметки..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Цвет</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e] scale-110" : "hover:scale-110"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1 btn-primary text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50">
                {saving ? "Сохраняем..." : editNote ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
