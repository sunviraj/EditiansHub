import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, getDocs } from 'firebase/firestore'
import { LogOut, MessageSquare, Calendar, Activity, CheckCircle, Clock } from 'lucide-react'

export default function ClientDashboard() {
    const { userData, logout } = useAuth()
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        completed: 0,
        warmingUp: 0
    })
    const [loading, setLoading] = useState(true)

    const activeChannelId = sessionStorage.getItem('activeChannel')
    const channelName = sessionStorage.getItem('channelName') || activeChannelId

    useEffect(() => {
        if (!activeChannelId) {
            navigate('/login')
            return
        }

        const fetchAnalytics = async () => {
            try {
                const q = query(collection(db, 'channels', activeChannelId, 'projects'))
                const snapshot = await getDocs(q)

                let total = 0
                let inProgress = 0
                let completed = 0
                let warmingUp = 0

                snapshot.forEach(doc => {
                    const data = doc.data()
                    total++
                    if (data.status === 'Completed') completed++
                    else if (data.status === 'In Progress') inProgress++
                    else warmingUp++
                })

                setStats({ total, inProgress, completed, warmingUp })
            } catch (error) {
                console.error("Error fetching analytics:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [activeChannelId, navigate])

    const handleLogout = async () => {
        await logout()
        sessionStorage.removeItem('activeChannel')
        sessionStorage.removeItem('channelName')
        navigate('/')
    }

    const displayName = userData?.displayName || 'Client'

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col pt-[10vh] animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">Welcome, {displayName}</h1>
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-accent/10 text-accent border-accent/30">
                            CEO / Client
                        </span>
                    </div>
                    <p className="text-slate-400">Managing Channel: <strong className="text-white">{channelName}</strong></p>
                </div>
                <button onClick={handleLogout} className="glass hover:bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors text-slate-300 w-fit">
                    <LogOut size={16} /> Disconnect
                </button>
            </div>

            {/* Analytics Grid */}
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Activity className="text-accent" /> High-Level Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-4xl font-black text-white mb-1">
                        {loading ? '...' : stats.total}
                    </p>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Total Projects</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Clock className="mb-2 text-yellow-500 opacity-50" size={24} />
                    <p className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.warmingUp}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest text-center">Warming Up</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Activity className="mb-2 text-blue-400 opacity-50" size={24} />
                    <p className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.inProgress}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">In Progress</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group border border-green-500/20">
                    <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CheckCircle className="mb-2 text-green-400 opacity-50" size={24} />
                    <p className="text-3xl font-bold text-green-400 mb-1">{loading ? '...' : stats.completed}</p>
                    <p className="text-xs font-medium text-green-500/70 uppercase tracking-widest">Completed</p>
                </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-xl font-semibold mb-4 text-white mt-4">Command Center</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => navigate('/chat')}
                    className="glass-panel p-8 rounded-3xl text-left hover:scale-[1.02] transition-transform duration-300 group cursor-pointer border border-accent/20 hover:border-accent/60 relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[50px] rotate-12 group-hover:bg-accent/20 transition-colors pointer-events-none"></div>
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                        <MessageSquare size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Live Operations Chat</h3>
                    <p className="text-slate-400 text-sm">Real-time direction and feedback with your selected editing team.</p>
                </button>

                <button
                    onClick={() => navigate('/projects')}
                    className="glass-panel p-8 rounded-3xl text-left hover:scale-[1.02] transition-transform duration-300 group cursor-pointer border border-highlight/20 hover:border-highlight/60 relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-highlight/10 blur-[50px] rotate-12 group-hover:bg-highlight/20 transition-colors pointer-events-none"></div>
                    <div className="w-14 h-14 rounded-2xl bg-highlight/20 flex items-center justify-center mb-6 text-highlight group-hover:scale-110 transition-transform">
                        <Calendar size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Project Oversight</h3>
                    <p className="text-slate-400 text-sm">Monitor deliveries, manage scripts, and track all ongoing deadlines.</p>
                </button>
            </div>
        </div>
    )
}
