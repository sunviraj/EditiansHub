import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Trash2, RefreshCw, Trophy, ChevronUp, ChevronDown } from 'lucide-react'

export default function AdminDashboard() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const [channels, setChannels] = useState([])
    const [users, setUsers] = useState([])
    const [newChannelName, setNewChannelName] = useState('')
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        try {
            // fetch users
            const uSnap = await getDocs(collection(db, 'users'))
            setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })))

            // fetch channels
            const cSnap = await getDocs(collection(db, 'channels'))
            setChannels(cSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (err) {
            console.error("Error fetching admin data:", err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to remove this user from the platform?')) {
            try {
                await deleteDoc(doc(db, 'users', id))
                fetchData()
            } catch (err) {
                console.error("Error deleting user:", err)
                alert("Could not delete user. Check permissions.")
            }
        }
    }

    const handleUpdateName = async (id, newName) => {
        try {
            await updateDoc(doc(db, 'users', id), {
                displayName: newName
            });
            fetchData();
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update user name.");
        }
    }

    const handleUpdateLevel = async (userId, newLevel) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                level: newLevel
            })
            // Update local state instead of full re-fetch
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, level: newLevel } : u))
        } catch (error) {
            console.error("Error updating level:", error)
            alert("Failed to update level.")
        }
    }

    const handleCreateChannel = async (e) => {
        e.preventDefault()
        if (!newChannelName.trim()) return
        setLoading(true)

        // Generate a secure 4 digit pin
        const pin = Math.floor(1000 + Math.random() * 9000).toString()

        await addDoc(collection(db, 'channels'), {
            name: newChannelName,
            pin: pin,
            createdAt: serverTimestamp()
        })

        setNewChannelName('')
        setLoading(false)
        fetchData()
    }

    const handleDeleteChannel = async (id) => {
        if (window.confirm('Are you sure you want to delete this channel? All messages inside might become orphaned.')) {
            await deleteDoc(doc(db, 'channels', id))
            fetchData()
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (e) {
            // Catch if there was no firebase login to begin with
        }
        sessionStorage.removeItem('isAdmin')
        navigate('/')
    }

    return (
        <div className="min-h-screen p-6" id="admin-dashboard">
            <div className="glass-panel max-w-6xl mx-auto">
                <header className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
                    <div className="flex items-center gap-3">
                        <Shield className="text-red-400" size={32} />
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                            Admin Station
                        </h2>
                    </div>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm px-4 py-2 rounded-lg transition-colors">Sign Out</button>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col h-[600px]">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-semibold">Manage Users</h3>
                            <button onClick={fetchData} className="text-slate-400 hover:text-white" title="Refresh">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto custom-scroll flex-1 pr-2">
                            {users.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center mt-10">No users registered yet.</p>
                            ) : users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 glass rounded-lg">
                                    <div className="flex items-center gap-3 truncate pr-4 w-full">
                                        {user.photoURL && (
                                            <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                                        )}
                                        <div className="truncate">
                                            <p className="font-semibold text-sm truncate">{user.displayName || 'Unnamed User'}</p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : user.role === 'editor' ? 'bg-highlight/20 text-highlight' : 'bg-accent/20 text-accent'}`}>
                                            {user.role}
                                        </span>
                                        {user.role !== 'admin' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const newName = window.prompt("Enter new nickname for this user:", user.displayName);
                                                        if (newName && newName.trim() !== "") {
                                                            handleUpdateName(user.id, newName.trim());
                                                        }
                                                    }}
                                                    className="text-slate-500 hover:text-white p-1 rounded transition-colors"
                                                    title="Edit Nickname"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col h-[600px]">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-semibold">Channels & PINs</h3>
                            <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">Channels limit PIN access</span>
                        </div>

                        <form onSubmit={handleCreateChannel} className="mb-6 flex gap-2">
                            <input
                                type="text"
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value)}
                                placeholder="E.g. MrBeast Main Channel"
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-red-400 text-sm"
                            />
                            <button type="submit" disabled={loading || !newChannelName.trim()} className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap">
                                Create
                            </button>
                        </form>

                        <div className="space-y-4 overflow-y-auto custom-scroll flex-1 pr-2">
                            {channels.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center mt-10">No channels created.</p>
                            ) : channels.map(channel => (
                                <div key={channel.id} className="flex items-center justify-between p-3 glass rounded-lg border-l-4 border-l-red-500/50">
                                    <div>
                                        <p className="font-semibold text-sm">{channel.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">PIN: <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-[14px] tracking-widest selection:bg-red-500/50">{channel.pin}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                sessionStorage.setItem('activeChannel', channel.id)
                                                sessionStorage.setItem('channelName', channel.name)
                                                navigate('/chat')
                                            }}
                                            className="px-3 py-1 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs rounded transition-colors border border-red-500/20 whitespace-nowrap"
                                        >
                                            Enter Chat
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChannel(channel.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                                            title="Delete Channel"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Full-width Leaderboard Control Row */}
                <div className="bg-black/20 p-6 rounded-xl border border-white/5 mt-8 max-h-[600px] flex flex-col">
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex items-center gap-3">
                            <Trophy className="text-yellow-500" size={24} />
                            <h3 className="text-xl font-semibold">Leaderboard Manager</h3>
                        </div>
                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">Adjust editor levels in real-time</span>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto custom-scroll flex-1 w-full rounded-lg">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="text-sm text-slate-400 border-b border-white/10">
                                    <th className="p-3 font-medium">Rank</th>
                                    <th className="p-3 font-medium">User</th>
                                    <th className="p-3 font-medium">Role</th>
                                    <th className="p-3 font-medium text-center">Level</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...users].sort((a, b) => {
                                    const levelA = a.level || 0
                                    const levelB = b.level || 0
                                    if (levelB !== levelA) return levelB - levelA
                                    const roleWeight = { admin: 3, client: 2, editor: 1 }
                                    return (roleWeight[b.role] || 0) - (roleWeight[a.role] || 0)
                                }).filter(u => u.role !== 'admin' && u.role !== 'client').map((u, i) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 pl-4 font-black text-slate-500">#{i + 1}</td>
                                        <td className="p-3">
                                            <p className="font-semibold text-white">{u.displayName || 'Unnamed User'}</p>
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-highlight/20 text-highlight px-2 py-1 rounded text-xs tracking-wider uppercase font-bold">
                                                Editor
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="font-bold text-yellow-500 text-lg">{u.level || 0}</span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleUpdateLevel(u.id, (u.level || 0) + 1)}
                                                    className="p-1 px-3 bg-white/5 hover:bg-green-500/20 text-white hover:text-green-400 rounded transition-colors flex items-center justify-center gap-1"
                                                    title="Increase Level"
                                                >
                                                    <ChevronUp size={16} /> +1 Level
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateLevel(u.id, Math.max(0, (u.level || 0) - 1))}
                                                    disabled={(u.level || 0) <= 0}
                                                    className="p-1 px-3 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded transition-colors disabled:opacity-30 flex items-center justify-center gap-1"
                                                    title="Decrease Level"
                                                >
                                                    <ChevronDown size={16} /> -1 Level
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
