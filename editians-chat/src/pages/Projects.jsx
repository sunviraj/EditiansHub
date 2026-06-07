import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, ExternalLink, MessageSquare, Shield, Clock, CheckCircle, CircleDashed, Edit2, UserPlus } from 'lucide-react'

export default function Projects() {
    const { currentUser, userData } = useAuth()
    const navigate = useNavigate()

    const [projects, setProjects] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form states
    const [title, setTitle] = useState('')
    const [script, setScript] = useState('')
    const [link, setLink] = useState('')
    const [deadline, setDeadline] = useState('')

    // Assignment and Edit states
    const [editors, setEditors] = useState([])
    const [editingProjectId, setEditingProjectId] = useState(null)
    const [assignedTo, setAssignedTo] = useState('')
    const [assignedToName, setAssignedToName] = useState('')

    const isAdmin = sessionStorage.getItem('isAdmin') === 'true'
    const activeChannelId = sessionStorage.getItem('activeChannel')
    const channelName = sessionStorage.getItem('channelName') || activeChannelId

    useEffect(() => {
        // Fetch editors for assignment dropdown
        const fetchEditors = async () => {
            if (isAdmin || userData?.role === 'admin') {
                const q = query(collection(db, 'users'), where('role', '==', 'editor'))
                const snap = await getDocs(q)
                const editorList = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                setEditors(editorList)
            }
        }
        fetchEditors()
    }, [isAdmin, userData])

    useEffect(() => {
        if (!activeChannelId) {
            navigate('/login')
            return;
        }

        const q = query(
            collection(db, 'channels', activeChannelId, 'projects'),
            orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let projs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            setProjects(projs)
        })

        return () => unsubscribe()
    }, [activeChannelId, navigate])

    const resetForm = () => {
        setEditingProjectId(null)
        setTitle('')
        setScript('')
        setLink('')
        setDeadline('')
        setAssignedTo('')
        setAssignedToName('')
        setShowModal(false)
    }

    const openEditModal = (proj) => {
        setEditingProjectId(proj.id)
        setTitle(proj.title)
        setScript(proj.script || '')
        setLink(proj.link || '')
        setDeadline(proj.deadline || '')
        setAssignedTo(proj.assignedTo || '')
        setAssignedToName(proj.assignedToName || '')
        setShowModal(true)
    }

    const handleSaveProject = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const projectData = {
                title,
                script,
                link,
                deadline,
                assignedTo,
                assignedToName
            }

            if (editingProjectId) {
                await updateDoc(doc(db, 'channels', activeChannelId, 'projects', editingProjectId), projectData)
            } else {
                await addDoc(collection(db, 'channels', activeChannelId, 'projects'), {
                    ...projectData,
                    status: 'Warming Up', // Default status
                    createdBy: userData?.displayName || (isAdmin ? 'Administrator' : 'Unknown'),
                    createdAt: serverTimestamp()
                })
            }
            resetForm()
        } catch (err) {
            console.error("Error saving project:", err)
            alert("Failed to save project")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (projectId, newStatus) => {
        try {
            await updateDoc(doc(db, 'channels', activeChannelId, 'projects', projectId), {
                status: newStatus
            })
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteProject = async (projectId) => {
        if (window.confirm("Delete this project?")) {
            try {
                await deleteDoc(doc(db, 'channels', activeChannelId, 'projects', projectId))
            } catch (err) {
                console.error(err)
            }
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Warming Up': return <CircleDashed className="text-slate-400" size={16} />
            case 'In Progress': return <Clock className="text-accent" size={16} />
            case 'Completed': return <CheckCircle className="text-green-400" size={16} />
            default: return <CircleDashed size={16} />
        }
    }

    return (
        <div className="h-screen max-w-6xl mx-auto flex flex-col p-4 md:p-6" id="projects-page">
            <header className="glass-panel px-6 py-4 mb-4 flex items-center justify-between rounded-t-2xl border-b-[3px] border-b-highlight/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-highlight/20 flex items-center justify-center">
                        <Calendar className="text-highlight" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">{channelName} - Content Kanban</h2>
                        <p className="text-xs text-slate-400">Manage scripts, links, and deadlines.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0 justify-end">
                    <button
                        onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                        className="hidden sm:flex px-3 py-1 glass hover:bg-white/10 rounded-lg text-sm items-center gap-2 transition-colors"
                    >
                        {isAdmin ? <Shield size={16} className="text-highlight" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-highlight"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>}
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-4 py-2 glass hover:bg-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                        <MessageSquare size={16} /> <span className="hidden sm:inline">Back to Chat</span>
                    </button>
                    {(userData?.role === 'admin' || isAdmin) && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true) }}
                            className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">New Project</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll pb-10">
                {projects.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Calendar size={48} className="mb-4 opacity-50 text-highlight" />
                        <p>No projects created yet in this channel.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(proj => (
                            <div key={proj.id} className="glass-panel p-5 rounded-2xl flex flex-col hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-white line-clamp-2 pr-2">{proj.title}</h3>
                                    {(userData?.role === 'admin' || isAdmin) && (
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(proj)} className="text-slate-500 hover:text-white transition-colors" title="Edit Project">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteProject(proj.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Delete Project">
                                                <Shield size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {proj.assignedToName && (
                                    <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10 w-fit px-2 py-1 rounded mt-[-8px] mb-3">
                                        <UserPlus size={12} /> Assigned: {proj.assignedToName}
                                    </div>
                                )}

                                {proj.deadline && (
                                    <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 w-fit px-2 py-1 rounded mb-4">
                                        <Clock size={12} /> Deadline: {proj.deadline}
                                    </div>
                                )}

                                <div className="space-y-3 flex-1 mb-6">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Script / Notes</p>
                                        <div className="bg-black/20 p-3 rounded-lg text-sm text-slate-300 max-h-32 overflow-y-auto custom-scroll whitespace-pre-wrap">
                                            {proj.script || 'No script provided.'}
                                        </div>
                                    </div>

                                    {proj.link && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Project Link</p>
                                            <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-accent hover:text-white bg-accent/10 hover:bg-accent/20 px-3 py-2 rounded-lg transition-colors truncate">
                                                <ExternalLink size={14} className="flex-shrink-0" />
                                                <span className="truncate">{proj.link}</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-white/10 mt-auto">
                                    <p className="text-xs text-slate-500 mb-2">Status</p>
                                    <div className="flex gap-1 bg-black/40 rounded-lg p-1">
                                        {['Warming Up', 'In Progress', 'Completed'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(proj.id, status)}
                                                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 text-[10px] sm:text-[11px] font-medium leading-tight rounded-md transition-all ${proj.status === status ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                {getStatusIcon(status)}
                                                <span className="text-center">{status}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">{editingProjectId ? 'Edit Project' : 'Create New Project'}</h2>
                        <form onSubmit={handleSaveProject} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Title</label>
                                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-highlight text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Deadline Date</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-highlight text-sm text-slate-300 [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Script / Brief</label>
                                <textarea rows="3" value={script} onChange={e => setScript(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-highlight text-sm text-white resize-none" placeholder="Paste script or instructions..." />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Resource Link</label>
                                <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-highlight text-sm text-white" placeholder="Google Drive, Dropbox, etc." />
                            </div>
                            {(isAdmin || userData?.role === 'admin') && (
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Assign Editor</label>
                                    <select
                                        value={assignedTo}
                                        onChange={e => {
                                            setAssignedTo(e.target.value)
                                            if (e.target.value === '') {
                                                setAssignedToName('')
                                            } else {
                                                setAssignedToName(e.target.options[e.target.selectedIndex].text)
                                            }
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-highlight text-sm text-slate-300"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {editors.map(ed => (
                                            <option key={ed.id} value={ed.id}>{ed.displayName || ed.role}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                <button type="submit" disabled={loading || !title} className="btn-primary px-6 py-2 text-sm">{editingProjectId ? 'Save Changes' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
