import React, { useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore'

export default function NotificationManager() {
    const { currentUser, userData } = useAuth()
    const activeChannelId = sessionStorage.getItem('activeChannel')

    // Custom notification sound synthesis
    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.error("Audio playback failed", e)
        }
    }

    useEffect(() => {
        if (!activeChannelId) return

        let uid = currentUser?.uid
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true'
        if (isAdmin && !uid) {
            uid = sessionStorage.getItem('adminSessionId')
        }
        if (!uid) return

        // 1. Listen for new messages
        let isInitialMessagesLoad = true;
        const messagesQuery = query(collection(db, 'channels', activeChannelId, 'messages'))
        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            if (isInitialMessagesLoad) {
                isInitialMessagesLoad = false;
                return; // Skip alerting for existing messages on first load
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const msg = change.doc.data()
                    // Don't notify if I sent it
                    if (msg.senderId !== uid) {
                        playNotificationSound()
                        toast(`New message from ${msg.senderName || msg.senderRole}`, {
                            icon: '💬',
                            style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                        })
                        // Native browser notification
                        if (Notification.permission === 'granted') {
                            new Notification(`New message from ${msg.senderName || msg.senderRole}`, {
                                body: msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : '')
                            })
                        }
                    }
                }
            })
        })

        // 2. Listen for project status changes (Completed)
        let isInitialProjectsLoad = true;
        const projectsQuery = query(collection(db, 'channels', activeChannelId, 'projects'))
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            if (isInitialProjectsLoad) {
                isInitialProjectsLoad = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const project = change.doc.data()

                    const StorageKey = `notified_completed_${change.doc.id}`
                    if (project.status === 'Completed' && !sessionStorage.getItem(StorageKey)) {
                        sessionStorage.setItem(StorageKey, 'true')
                        playNotificationSound()
                        toast.success(`Project "${project.title}" marked as Completed!`, {
                            duration: 5000,
                            style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(34,197,94,0.3)' }
                        })
                        if (Notification.permission === 'granted') {
                            new Notification('Project Completed! 🎉', {
                                body: `Project "${project.title}" has been completed.`
                            })
                        }
                    }
                }
            })
        })

        // 3. Periodic check for deadlines
        const checkDeadlines = async () => {
            try {
                const snap = await getDocs(projectsQuery)
                const now = new Date()
                snap.forEach(document => {
                    const project = document.data()
                    if (project.status !== 'Completed' && project.deadline) {
                        const deadlineDate = new Date(`${project.deadline}T23:59:59`) // End of the day usually

                        if (deadlineDate < now) {
                            const StorageKey = `notified_deadline_${document.id}`
                            if (!localStorage.getItem(StorageKey)) {
                                playNotificationSound()
                                toast.error(`Deadline Alert: "${project.title}" is overdue!`, {
                                    duration: 8000,
                                    style: { background: '#2e1010', color: '#fff', border: '1px solid rgba(239,68,68,0.5)' }
                                })
                                if (Notification.permission === 'granted') {
                                    new Notification('Deadline Alert! 🚨', {
                                        body: `Project "${project.title}" has crossed the deadline.`
                                    })
                                }
                                localStorage.setItem(StorageKey, 'true')
                            }
                        }
                    }
                })
            } catch (error) {
                console.error("Error checking deadlines:", error)
            }
        }

        const interval = setInterval(checkDeadlines, 60000) // Check every 60s
        checkDeadlines() // Initial check

        // Request browser notification permission
        if (Notification.permission !== 'denied') {
            Notification.requestPermission()
        }

        return () => {
            unsubscribeMessages()
            unsubscribeProjects()
            clearInterval(interval)
        }
    }, [currentUser, activeChannelId])

    return <Toaster position="top-right" />
}
