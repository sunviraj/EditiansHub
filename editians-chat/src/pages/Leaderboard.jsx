import React, { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Trophy, Star, Shield, User, Award, ArrowUp, ArrowDown } from 'lucide-react'

export default function Leaderboard() {
    const { userData } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Auth Check
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true' || userData?.role === 'admin'

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, 'users'))
            const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }))

            // Sort by level/points descending
            usersList.sort((a, b) => {
                const levelA = a.level || 0
                const levelB = b.level || 0
                if (levelB !== levelA) return levelB - levelA
                // Then sort by role priority (admin > client > editor)
                const roleWeight = { admin: 3, client: 2, editor: 1 }
                return (roleWeight[b.role] || 0) - (roleWeight[a.role] || 0)
            })

            setUsers(usersList)
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleUpdateLevel = async (userId, newLevel) => {
        if (!isAdmin) return
        try {
            await updateDoc(doc(db, 'users', userId), { level: newLevel })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, level: newLevel } : u))
        } catch (error) {
            console.error("Error updating level:", error)
        }
    }

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">Me (Admin)</span>
            case 'client':
                return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-accent/10 text-accent border border-accent/30">CEO / Client</span>
            case 'editor':
                return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-highlight/10 text-highlight border border-highlight/30">Editor</span>
            default:
                return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/30">{role}</span>
        }
    }

    return (
        <div className="h-full min-h-[80vh] w-full max-w-5xl mx-auto flex flex-col p-4 md:p-6 pb-20 fade-in zoom-in-95 duration-500">
            <header className="glass-panel px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-b-[3px] border-b-yellow-500/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                        <Trophy size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Team Rankings</h1>
                        <p className="text-sm text-yellow-500/70 font-medium">Editor Leaderboard & Ranks</p>
                    </div>
                </div>
            </header>

            <div className="glass-panel rounded-2xl flex-1 overflow-hidden flex flex-col border border-white/5 relative z-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 border-b border-white/5 text-xs uppercase tracking-widest text-slate-400">
                                <th className="p-4 pl-6 font-medium w-20">Rank</th>
                                <th className="p-4 font-medium">Team Member</th>
                                <th className="p-4 font-medium">Designation</th>
                                <th className="p-4 font-medium text-center">Level / Points</th>
                                {isAdmin && <th className="p-4 font-medium text-right pr-6">Manage Level</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                                            Loading Rankings...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No team members found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u, i) => {
                                    const level = u.level || 0;
                                    const isTopThree = i < 3 && level > 0;

                                    return (
                                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-4 pl-6">
                                                {isTopThree ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-lg
                                                        ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600' :
                                                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                                                'bg-gradient-to-br from-amber-600 to-amber-800'}`}>
                                                        {i + 1}
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-slate-400 bg-black/40 border border-white/10 group-hover:border-white/20 transition-colors">
                                                        {i + 1}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white whitespace-nowrap">{u.displayName || 'Unknown User'}</p>
                                                        {isAdmin && <p className="text-[10px] text-slate-500 font-mono">{u.email || u.id}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td className="p-4 text-center">
                                                {u.role === 'editor' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full font-bold">
                                                        <Star size={14} className={level > 10 ? 'fill-yellow-500' : ''} />
                                                        Lv. {level}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
                                                        <Shield size={12} /> Excluded
                                                    </div>
                                                )}
                                            </td>

                                            {isAdmin && (
                                                <td className="p-4 pr-6 text-right">
                                                    {u.role === 'editor' ? (
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleUpdateLevel(u.id, Math.max(0, level - 1))}
                                                                className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition-colors border border-red-500/30"
                                                                title="Decrease Level"
                                                            >
                                                                <ArrowDown size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateLevel(u.id, level + 1)}
                                                                className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 flex items-center justify-center transition-colors border border-green-500/30"
                                                                title="Increase Level"
                                                            >
                                                                <ArrowUp size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic block mt-1">N/A</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
