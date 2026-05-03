"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface AdminNote {
  id: number;
  userId: number;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  userNickname: string | null;
  userEmail: string | null;
}

interface Stats {
  totalUsers: number;
  totalNotes: number;
  verifiedUsers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allNotes, setAllNotes] = useState<AdminNote[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const meData = await meRes.json();
      if (meData.user.role !== "developer") { router.push("/dashboard"); return; }
      setCurrentUser(meData.user);

      const res = await fetch("/api/admin");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
      setAllNotes(data.notes);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Удалить пользователя и все его заметки?")) return;
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user", id: userId }),
    });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setAllNotes(prev => prev.filter(n => n.userId !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : null);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Удалить заметку?")) return;
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", id: noteId }),
    });
    if (res.ok) {
      setAllNotes(prev => prev.filter(n => n.id !== noteId));
      setStats(prev => prev ? { ...prev, totalNotes: prev.totalNotes - 1 } : null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userNotes = selectedUser
    ? allNotes.filter(n => n.userId === selectedUser.id)
    : [];

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Панель разработчика
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all"
            >
              📝 Мои заметки
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
            <div className="glass rounded-2xl p-6">
              <div className="text-sm text-slate-400 mb-1">Пользователи</div>
              <div className="text-3xl font-bold text-purple-400">{stats.totalUsers}</div>
            </div>
            <div className="glass rounded-2xl p-6">
              <div className="text-sm text-slate-400 mb-1">Всего заметок</div>
              <div className="text-3xl font-bold text-blue-400">{stats.totalNotes}</div>
            </div>
            <div className="glass rounded-2xl p-6">
              <div className="text-sm text-slate-400 mb-1">Подтверждённые</div>
              <div className="text-3xl font-bold text-green-400">{stats.verifiedUsers}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className={`${selectedUser ? "lg:col-span-1" : "lg:col-span-3"}`}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-100">Пользователи</h2>
                <span className="text-xs text-slate-500">{filteredUsers.length} записей</span>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 transition-all mb-4 text-sm"
                placeholder="🔍 Поиск по никнейму или email..."
              />

              <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${selectedUser?.id === u.id ? "bg-purple-500/15 border border-purple-500/30" : "bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10"}`}
                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ background: `linear-gradient(135deg, ${u.role === "developer" ? "#f59e0b, #f97316" : "#7c3aed, #a855f7"})` }}
                        >
                          {u.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200 truncate">{u.nickname}</span>
                            {u.role === "developer" ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                                ⚡ РАЗРАБ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
                                юзер
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {u.isVerified ? (
                          <span className="w-2 h-2 rounded-full bg-green-400" title="Подтверждён" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-red-400" title="Не подтверждён" />
                        )}
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
                            title="Удалить"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                      <span>📅 {new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                      <span>📝 {allNotes.filter(n => n.userId === u.id).length} заметок</span>
                      <span>{u.isVerified ? "✅ Подтверждён" : "❌ Не подтверждён"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Notes Panel */}
          {selectedUser && (
            <div className="lg:col-span-2 animate-fade-in">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${selectedUser.role === "developer" ? "#f59e0b, #f97316" : "#7c3aed, #a855f7"})` }}
                    >
                      {selectedUser.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">
                        Заметки — {selectedUser.nickname}
                      </h2>
                      <p className="text-xs text-slate-500">{selectedUser.email} • {userNotes.length} заметок</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white transition-colors p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {userNotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-3">📭</div>
                    <p>У этого пользователя пока нет заметок</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                    {userNotes.map(note => (
                      <div key={note.id} className="bg-white/3 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-all"
                        style={{ borderLeft: `3px solid ${note.color}` }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-200">{note.title}</h3>
                            <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap line-clamp-4">{note.content || "Пустая заметка"}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                              <span>Создана: {new Date(note.createdAt).toLocaleDateString("ru-RU")}</span>
                              <span>Обновлена: {new Date(note.updatedAt).toLocaleDateString("ru-RU")}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 shrink-0 ml-2 rounded-lg hover:bg-red-500/10"
                            title="Удалить заметку"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
