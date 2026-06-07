import React, { useState, useEffect, useRef } from 'react'
import { Send, User, LogOut, Calendar, Shield, CheckCheck, Lock, Unlock, Paperclip, X, Reply, Smile, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, setDoc, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore'

export default function Chat() {
    const { currentUser, userData, logout } = useAuth()
    const navigate = useNavigate()

    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // New feature states
    const [allUsers, setAllUsers] = useState([])
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState('')
    const [typingUsers, setTypingUsers] = useState([])
    const typingTimeoutRef = useRef(null)
    const fileInputRef = useRef(null)
    const [instanceId] = useState(() => 'tab-' + Math.random().toString(36).substr(2, 9))
    const [isChatOpen, setIsChatOpen] = useState(true)
    const [attachment, setAttachment] = useState(null)
    const [replyingTo, setReplyingTo] = useState(null)
    const [showReactionMenu, setShowReactionMenu] = useState(null)

    const activeChannelId = sessionStorage.getItem('activeChannel')
    const channelName = sessionStorage.getItem('channelName') || activeChannelId

    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminSessionId = sessionStorage.getItem('adminSessionId') || (() => {
        const id = 'admin-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('adminSessionId', id);
        return id;
    })();
    const myUid = currentUser?.uid || (isAdmin ? adminSessionId : 'unknown-uid');
    const myRole = userData?.role || (isAdmin ? 'admin' : 'unknown');
    const myName = userData?.displayName || (isAdmin ? 'Administrator' : 'Unknown');
    const myPhotoURL = userData?.photoURL || null;

    useEffect(() => {
        if (!activeChannelId) {
            // If they somehow got here without a channel, kick them out
            navigate('/login')
            return;
        }

        // Subscribe to messages in this channel
        const q = query(
            collection(db, 'channels', activeChannelId, 'messages'),
            orderBy('createdAt', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setMessages(msgs)

            // Handle Read Receipts for incoming messages
            const unreadMsgs = snapshot.docs.filter(d => {
                const data = d.data()
                return data.senderId !== myUid && (!data.readBy || !data.readBy.includes(myUid));
            })
            unreadMsgs.forEach(d => {
                updateDoc(doc(db, 'channels', activeChannelId, 'messages', d.id), {
                    readBy: arrayUnion(myUid)
                }).catch(err => console.error("Error setting read status: ", err))
            })

            // Scroll to bottom when messages load
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        })

        // Listen for Channel Settings
        const channelRef = doc(db, 'channels', activeChannelId)
        const unsubChannel = onSnapshot(channelRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setIsChatOpen(data.isChatOpen ?? true)
            }
        })

        return () => {
            unsubscribe()
            unsubChannel()
        }
    }, [activeChannelId, navigate, myUid])

    // Fetch users for mentions
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snap = await getDocs(collection(db, 'users'))
                const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                // Create a hardcoded Admin user for mentions if they aren't in the DB
                usersList.push({ id: 'admin', displayName: 'Admin', role: 'admin' })
                setAllUsers(usersList)
            } catch (e) { console.error("Could not fetch users for mentions", e) }
        }
        fetchUsers()
    }, [])

    // Listen for typing events
    useEffect(() => {
        if (!activeChannelId) return;
        const q = collection(db, 'channels', activeChannelId, 'typing');
        const unsub = onSnapshot(q, (snapshot) => {
            const typing = []
            snapshot.forEach(doc => {
                const data = doc.data()
                if (data.typing && doc.id !== instanceId) {
                    typing.push(data.name)
                }
            })
            setTypingUsers(typing)
        })
        return () => unsub()
    }, [activeChannelId, instanceId])


    const handleReact = async (msgId, emoji) => {
        if (!activeChannelId) return
        const msg = messages.find(m => m.id === msgId)
        if (!msg) return

        const hasReacted = msg.reactions?.[emoji]?.includes(myUid)
        try {
            await updateDoc(doc(db, 'channels', activeChannelId, 'messages', msgId), {
                [`reactions.${emoji}`]: hasReacted ? arrayRemove(myUid) : arrayUnion(myUid)
            })
        } catch (error) {
            console.error("Error reacting:", error)
        }
        setShowReactionMenu(null)
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if ((!input.trim() && !attachment) || !activeChannelId) return

        const msgText = input.trim()
        const msgAttachment = attachment
        const msgReplyTo = replyingTo ? {
            id: replyingTo.id,
            name: replyingTo.senderName || replyingTo.senderRole,
            text: replyingTo.text || 'Image'
        } : null

        setInput('') // Optimistic clear
        setAttachment(null)
        setShowMentions(false)
        setReplyingTo(null)

        // Clear typing indicator instantly on send
        setDoc(doc(db, 'channels', activeChannelId, 'typing', instanceId), { typing: false }, { merge: true })

        try {
            await addDoc(collection(db, 'channels', activeChannelId, 'messages'), {
                text: msgText,
                attachment: msgAttachment,
                senderId: myUid,
                senderRole: myRole,
                senderName: myName,
                senderPhotoURL: myPhotoURL,
                readBy: [], // Array of UIDs that have seen this message
                replyTo: msgReplyTo,
                reactions: {},
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error("Error sending message: ", error)
            // Revert input on error
            setInput(msgText)
        }
    }

    const handleLogout = async () => {
        // Clear typing status before leaving
        if (activeChannelId) {
            await setDoc(doc(db, 'channels', activeChannelId, 'typing', instanceId), { typing: false }, { merge: true }).catch(console.error)
        }
        await logout()
        sessionStorage.removeItem('activeChannel')
        sessionStorage.removeItem('channelName')
        navigate('/')
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { // 5MB Limit
            alert("File is too large. Choose an image under 5MB.")
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            setAttachment(event.target.result)
        }
        reader.readAsDataURL(file)
    }

    const toggleChatLock = async () => {
        if (!isAdmin && myRole !== 'admin') return;
        try {
            await updateDoc(doc(db, 'channels', activeChannelId), {
                isChatOpen: !isChatOpen
            })
        } catch (error) {
            console.error("Error toggling chat lock: ", error)
        }
    }

    // Determine standard role styling. Editor is accent, Client is somewhat neutral/dark.
    const isMe = (msg) => msg.senderId === myUid

    const handleInputChange = (e) => {
        const val = e.target.value
        setInput(val)

        // Check for typing @ mentions
        const lastWord = val.split(' ').pop()
        if (lastWord.startsWith('@')) {
            setShowMentions(true)
            setMentionFilter(lastWord.substring(1).toLowerCase())
        } else {
            setShowMentions(false)
        }
    }

    const handleKeyDown = () => {
        if (!activeChannelId) return;
        setDoc(doc(db, 'channels', activeChannelId, 'typing', instanceId), { typing: true, name: myName }, { merge: true }).catch(console.error)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            setDoc(doc(db, 'channels', activeChannelId, 'typing', instanceId), { typing: false }, { merge: true }).catch(console.error)
        }, 2000)
    }

    const handleBlur = () => {
        if (!activeChannelId) return;
        setDoc(doc(db, 'channels', activeChannelId, 'typing', instanceId), { typing: false }, { merge: true }).catch(console.error)
    }

    const handleMentionSelect = (selectedName) => {
        const words = input.split(' ')
        words.pop() // remove the partial @word
        const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${selectedName} `
        setInput(newText)
        setShowMentions(false)
        inputRef.current?.focus()
    }

    const filteredUsers = allUsers.filter(u =>
        (u.displayName || u.role || '').toLowerCase().includes(mentionFilter)
    ).slice(0, 5)

    return (
        <div className="h-screen w-full max-w-5xl mx-auto flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden" id="chat-page">
            <header className="glass-panel px-6 py-4 mb-4 flex items-center justify-between rounded-t-2xl border-b-[3px] border-b-accent/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="text-accent" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">{channelName} - Chat</h2>
                        <p className="text-xs text-slate-400">You are a {userData?.role || (sessionStorage.getItem('isAdmin') === 'true' ? 'admin' : 'unknown')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0 justify-end">
                    {(isAdmin || myRole === 'admin') && (
                        <button
                            onClick={toggleChatLock}
                            className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 transition-colors font-medium border ${isChatOpen
                                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                }`}
                            title={isChatOpen ? "Lock Chat" : "Unlock Chat"}
                        >
                            {isChatOpen ? <Unlock size={16} /> : <Lock size={16} />}
                            <span className="hidden sm:inline">{isChatOpen ? 'Open' : 'Locked'}</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                        className="px-3 py-1 glass hover:bg-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                        {isAdmin ? <Shield size={16} className="text-highlight" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-highlight"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>}
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/projects')}
                        className="px-3 py-1 glass hover:bg-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                        <Calendar size={16} className="text-highlight" /> <span className="hidden sm:inline">Board</span>
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors ml-2" title="Disconnect">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 glass-panel overflow-y-auto mb-4 p-4 sm:p-6 space-y-4 flex flex-col custom-scroll">
                {messages.map(msg => {
                    const sentByMe = isMe(msg)
                    const senderUser = allUsers.find(u => u.id === msg.senderId)
                    const photoToUse = msg.senderRole === 'admin' ? '/logo.png' : (senderUser?.photoURL || msg.senderPhotoURL)

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${sentByMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            <div className="flex-shrink-0 mt-auto mb-2">
                                {msg.senderRole === 'admin' ? (
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-[3px] overflow-hidden">
                                        <img src="/logo.png" alt="Admin Logo" className="w-full h-full object-contain" />
                                    </div>
                                ) : photoToUse ? (
                                    <img src={photoToUse} alt={msg.senderName} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center">
                                        <User size={14} className="text-slate-400" />
                                    </div>
                                )}
                            </div>

                            <div className={`relative group flex flex-col ${sentByMe ? 'items-end' : 'items-start'} min-w-[150px]`}>
                                <div
                                    className={`rounded-2xl p-4 relative ${sentByMe
                                        ? 'bg-accent/40 text-white rounded-tr-sm'
                                        : 'bg-slate-800/60 text-slate-200 rounded-tl-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                            {sentByMe ? 'You' : msg.senderName || msg.senderRole}
                                        </span>
                                    </div>

                                    {msg.replyTo && (
                                        <div className="mb-2 px-3 py-2 bg-black/20 border-l-2 border-white/30 rounded text-xs opacity-80 cursor-pointer">
                                            <p className="font-bold mb-0.5">{msg.replyTo.name}</p>
                                            <p className="truncate line-clamp-2 max-w-[200px]">{msg.replyTo.text}</p>
                                        </div>
                                    )}

                                    {msg.attachment && (
                                        <div className="relative group/attach inline-block">
                                            <img src={msg.attachment} alt="Attachment" className="max-w-[200px] sm:max-w-xs rounded-xl mb-2 object-cover border border-white/10" />
                                            <a
                                                href={msg.attachment}
                                                download={`img-${msg.id}.png`}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover/attach:opacity-100 transition-opacity backdrop-blur-sm"
                                                title="Download Image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            </a>
                                        </div>
                                    )}
                                    {msg.text && (
                                        <p className="break-all whitespace-pre-wrap">
                                            {msg.text.split(' ').map((word, i) => {
                                                if (word.startsWith('@')) {
                                                    return <span key={i} className="text-highlight font-semibold">{word} </span>;
                                                }
                                                return word + ' ';
                                            })}
                                        </p>
                                    )}

                                    {/* Read Receipt */}
                                    {sentByMe && msg.readBy && msg.readBy.length > 0 && (
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-300 font-medium">
                                            <CheckCheck size={12} /> Read
                                        </div>
                                    )}
                                </div>

                                {/* Reactions Display */}
                                {msg.reactions && Object.entries(msg.reactions).some(([_, users]) => users.length > 0) && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${sentByMe ? 'justify-end' : 'justify-start'}`}>
                                        {Object.entries(msg.reactions).map(([emoji, users]) => {
                                            if (users.length === 0) return null;
                                            const hasReacted = users.includes(myUid);
                                            return (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReact(msg.id, emoji)}
                                                    className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-colors ${hasReacted ? 'bg-accent/20 border-accent/50 text-white' : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10'}`}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="text-[10px]">{users.length}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Action Bar */}
                                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${sentByMe ? '-left-24 flex-row-reverse' : '-right-24'}`}>
                                    <div className="relative">
                                        <button onClick={() => setShowReactionMenu(showReactionMenu === msg.id ? null : msg.id)} className="p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg">
                                            <Smile size={14} />
                                        </button>
                                        {showReactionMenu === msg.id && (
                                            <div className={`absolute top-full mt-1 flex gap-1 p-1.5 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 ${sentByMe ? 'right-0' : 'left-0'}`}>
                                                {['👍', '❤️', '😂', '🔥', '😮', '😢'].map(emoji => (
                                                    <button key={emoji} onClick={() => { handleReact(msg.id, emoji); setShowReactionMenu(null); }} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-lg transition-colors">
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg">
                                        <Reply size={14} />
                                    </button>
                                    {(isAdmin || myRole === 'admin') && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this message?")) {
                                                    await import('firebase/firestore').then(({ deleteDoc, doc }) => {
                                                        deleteDoc(doc(db, 'channels', activeChannelId, 'messages', msg.id))
                                                    })
                                                }
                                            }}
                                            className="p-1.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors shadow-lg"
                                            title="Delete Message"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Visual Typing Indicator Bubble */}
                {typingUsers.length > 0 && (
                    <div className="max-w-[75%] rounded-2xl p-4 bg-slate-800/60 text-slate-200 self-start rounded-tl-sm w-fit group animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 h-4 px-1 py-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="relative">
                {/* Mentions Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <ul className="max-h-40 overflow-y-auto custom-scroll py-1">
                            {filteredUsers.map((u, i) => {
                                const Name = u.displayName || u.role
                                return (
                                    <li
                                        key={i}
                                        onClick={() => handleMentionSelect(Name)}
                                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-white flex items-center gap-2"
                                    >
                                        <User size={14} className="text-accent" />
                                        {Name}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
                <div className="flex flex-col">
                    {replyingTo && (
                        <div className="bg-accent/10 p-3 rounded-t-2xl border border-white/5 border-b-0 flex items-start justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Reply size={14} className="text-accent" />
                                <div>
                                    <span className="font-semibold text-white">Replying to {replyingTo.senderName || replyingTo.senderRole}</span>
                                    <p className="text-xs opacity-70 truncate max-w-[250px] sm:max-w-sm">{replyingTo.text || 'Attachment'}</p>
                                </div>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {attachment && (
                        <div className={`bg-black/30 p-2 border border-white/5 border-b-0 relative flex items-start ${!replyingTo ? 'rounded-t-2xl' : ''}`}>
                            <img src={attachment} alt="Preview" className="h-16 w-auto object-cover rounded-md border border-white/10" />
                            <button
                                onClick={() => setAttachment(null)}
                                className="ml-2 p-1 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded-full transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSend} className={`glass-panel p-2 flex gap-2 relative ${attachment || replyingTo ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                        {(!isChatOpen && !isAdmin && myRole !== 'admin') && (
                            <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 border border-white/5 ${attachment ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                                <p className="flex items-center gap-2 text-red-400 font-medium">
                                    <Lock size={18} /> Chat is currently closed by Admin
                                </p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!isChatOpen && !isAdmin && myRole !== 'admin'}
                            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
                            title="Attach Image"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            placeholder={(!isChatOpen && !isAdmin && myRole !== 'admin') ? "Chat is closed" : "Type a secure message..."}
                            disabled={!isChatOpen && !isAdmin && myRole !== 'admin'}
                            className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-accent/50 transition-colors text-[16px] text-white placeholder:text-slate-500 disabled:opacity-50"
                        />
                        <button type="submit" disabled={(!input.trim() && !attachment) || (!isChatOpen && !isAdmin && myRole !== 'admin')} className="btn-primary flex-shrink-0 flex items-center justify-center w-12 h-12 !rounded-xl disabled:opacity-50">
                            <Send size={20} className="ml-1" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
