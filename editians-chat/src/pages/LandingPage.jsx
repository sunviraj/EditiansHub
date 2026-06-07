import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Zap } from 'lucide-react'

export default function LandingPage() {
    const navigate = useNavigate()
    const [particles, setParticles] = useState([])

    useEffect(() => {
        // Generate random particles
        const newParticles = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            size: Math.random() * 8 + 3 + 'px',
            animationDuration: Math.random() * 15 + 10 + 's',
            animationDelay: Math.random() * 10 + 's',
            opacity: Math.random() * 0.4 + 0.1
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-orange-950/80" id="landing-page">

            {/* Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute bg-orange-500 rounded-full"
                    style={{
                        left: p.left,
                        bottom: '-10%',
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        animation: `floatUp ${p.animationDuration} linear infinite`,
                        animationDelay: p.animationDelay,
                        boxShadow: '0 0 10px rgba(249, 115, 22, 0.8)'
                    }}
                />
            ))}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,0,0.05)_0,transparent_100%)] pointer-events-none"></div>

            <header className="text-center mb-16 max-w-3xl mt-10 relative z-10">
                <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-300 to-orange-600 mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    Editians Hub
                </h1>
                <p className="text-xl text-slate-300 md:text-2xl font-light">
                    The exclusive, secure portal connecting top-tier video editors with visionary clients.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-16 relative z-10">
                <div className="glass-panel border-orange-500/20 bg-black/40 text-center hover:scale-105 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300">
                    <div className="mx-auto w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mb-4 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Real-Time Sync</h3>
                    <p className="text-slate-400 text-sm">Lightning fast messaging powered by a modern infrastructure.</p>
                </div>
                <div className="glass-panel border-amber-500/20 bg-black/40 text-center hover:scale-105 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] transition-all duration-300">
                    <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Channel Based</h3>
                    <p className="text-slate-400 text-sm">Dedicated secure channels via unique 4-digit PINs.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-20 relative z-10">
                <button
                    onClick={() => navigate('/login')}
                    className="relative group overflow-hidden rounded-xl bg-orange-600 px-8 py-4 font-bold text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all hover:scale-105 hover:bg-orange-500 hover:shadow-[0_0_30px_rgba(234,88,12,0.6)]"
                    id="btn-login"
                >
                    <span className="relative z-10 text-lg uppercase tracking-wider">Enter Portal</span>
                    <div className="absolute inset-0 h-full w-full scale-0 rounded-xl bg-white/20 transition-all duration-300 group-hover:scale-100"></div>
                </button>
            </div>
        </div>
    )
}
