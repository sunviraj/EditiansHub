import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { LogOut, MessageSquare, Calendar, Trophy, Zap, AlertCircle, CheckCircle } from 'lucide-react'

export default function EditorDashboard() {
    const { userData, currentUser, logout } = useAuth()
    const navigate = useNavigate()

    const [myTasks, setMyTasks] = useState(0)
    const [loading, setLoading] = useState(true)

    const activeChannelId = sessionStorage.getItem('activeChannel')
    const channelName = sessionStorage.getItem('channelName') || activeChannelId

    useEffect(() => {
        if (!activeChannelId) {
            navigate('/login')
            return
        }

        const fetchAssignments = async () => {
            try {
                const uid = currentUser?.uid
                if (!uid) return

                const q = query(
                    collection(db, 'channels', activeChannelId, 'projects'),
                    where('assignedTo', '==', uid)
                )
                const snapshot = await getDocs(q)

                let activeCount = 0
                snapshot.forEach(doc => {
                    if (doc.data().status !== 'Completed') {
                        activeCount++
                    }
                })
                setMyTasks(activeCount)
            } catch (error) {
                console.error("Error fetching tasks:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [activeChannelId, navigate, currentUser])

    const handleLogout = async () => {
        await logout()
        sessionStorage.removeItem('activeChannel')
        sessionStorage.removeItem('channelName')
        navigate('/')
    }

    const displayName = userData?.displayName || 'Editor'
    const level = userData?.level || 0

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col pt-[10vh] animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-highlight/10 text-highlight border-highlight/30">
                            Editor
                        </span>
                    </div>
                    <p className="text-slate-400">Current Workspace: <strong className="text-white">{channelName}</strong></p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg">
                        <Zap size={16} />
                        <span className="font-bold text-sm">Level {level}</span>
                    </div>
                    <button onClick={handleLogout} className="glass hover:bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors text-slate-300 w-fit">
                        <LogOut size={16} /> Disconnect
                    </button>
                </div>
            </div>

            {/* Editor Focus Area */}
            {myTasks > 0 ? (
                <div className="mb-8 p-6 bg-highlight/10 border border-highlight/30 rounded-2xl flex items-center justify-between text-highlight shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-highlight/20 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Action Required</h3>
                            <p className="text-sm">You have {myTasks} active task{myTasks > 1 ? 's' : ''} assigned to you in this channel.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/projects')} className="bg-highlight hover:bg-highlight/80 text-white font-bold px-6 py-2 rounded-lg transition-colors">
                        View Tasks
                    </button>
                </div>
            ) : (
                <div className="mb-8 p-6 glass-panel rounded-2xl flex flex-col items-center justify-center py-10 text-slate-400">
                    <CheckCircle size={48} className="mb-3 opacity-20 text-green-400" />
                    <p>No active tasks assigned to you right now. Great job!</p>
                </div>
            )}

            {/* Quick Actions */}
            <h2 className="text-xl font-semibold mb-4 text-white">Editor Tools</h2>
            <div className="grid md:grid-cols-3 gap-6">
                <button
                    onClick={() => navigate('/chat')}
                    className="glass-panel p-8 rounded-3xl text-left hover:scale-[1.02] transition-transform duration-300 group cursor-pointer border border-accent/20 hover:border-accent/60 relative overflow-hidden flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[50px] rotate-12 group-hover:bg-accent/20 transition-colors pointer-events-none"></div>
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                        <MessageSquare size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Team Chat</h3>
                    <p className="text-slate-400 text-sm">Communicate with your team and clients directly.</p>
                </button>

                <button
                    onClick={() => navigate('/projects')}
                    className="glass-panel p-8 rounded-3xl text-left hover:scale-[1.02] transition-transform duration-300 group cursor-pointer border border-highlight/20 hover:border-highlight/60 relative overflow-hidden flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-highlight/10 blur-[50px] rotate-12 group-hover:bg-highlight/20 transition-colors pointer-events-none"></div>
                    <div className="w-14 h-14 rounded-2xl bg-highlight/20 flex items-center justify-center mb-6 text-highlight group-hover:scale-110 transition-transform">
                        <Calendar size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Project Board</h3>
                    <p className="text-slate-400 text-sm">Grab links, read scripts, and update delivery status.</p>
                </button>

                <button
                    onClick={() => navigate('/leaderboard')}
                    className="glass-panel p-8 rounded-3xl text-left hover:scale-[1.02] transition-transform duration-300 group cursor-pointer border border-yellow-500/20 hover:border-yellow-500/60 relative overflow-hidden flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-yellow-500/10 blur-[50px] rotate-12 group-hover:bg-yellow-500/20 transition-colors pointer-events-none"></div>
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-6 text-yellow-500 group-hover:scale-110 transition-transform">
                        <Trophy size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">The Ranks</h3>
                    <p className="text-slate-400 text-sm">Check your current level and leaderboard standings.</p>
                </button>
            </div>
        </div>
    )
}
