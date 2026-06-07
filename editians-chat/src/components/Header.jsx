import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileModal from './ProfileModal'
import { Settings } from 'lucide-react'

export default function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentUser } = useAuth()
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

    if (location.pathname === '/') {
        return null
    }

    const handleLogoClick = () => {
        const isAdminSession = sessionStorage.getItem('isAdmin') === 'true'
        if (isAdminSession) {
            navigate('/admin')
        } else if (currentUser) {
            navigate('/dashboard')
        } else {
            navigate('/')
        }
    }

    return (
        <header className="fixed top-0 left-0 w-full h-16 z-[100] border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={handleLogoClick}
            >
                {/* Logo wrapper */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/5 border border-white/10 group-hover:border-accent/40 transition-colors">
                    <img
                        src="/logo.png"
                        alt="Editians Logo"
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<span class="text-xl font-black text-white px-2">E</span>';
                        }}
                    />
                </div>
                <h1 className="text-xl font-bold tracking-wide text-white group-hover:text-accent transition-colors hidden sm:block">
                    Editians <span className="text-slate-400 font-light">Hub</span>
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {currentUser && (
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        title="Profile Settings"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </header>
    )
}
