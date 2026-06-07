import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Since we are overriding the auth context, we will use a simpler navigation for hardcoded login
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            setError('')
            setLoading(true)

            // Hardcoded validation based on user request
            if (email === 'editianstudio@gmail.com' && password === 'editians12345') {
                // Just bypass Firebase Auth and force navigation to admin dashboard.
                // ProtectedRoute will block it natively since we don't have 'admin' role in userData,
                // so we need to either update AuthContext to understand this hardcoded admin, 
                // or temporarily stash standard auth and use a simple session flag.

                // For simplicity and to satisfy the immediate request without breaking the whole auth system:
                sessionStorage.setItem('isAdmin', 'true');
                navigate('/admin');
            } else {
                throw new Error('Invalid Admin Credentials')
            }
        } catch (err) {
            setError('Failed to login. Please check credentials or contact support.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="glass-panel w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <Shield size={24} />
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Admin Portal</h2>
                    <p className="text-slate-400 text-sm mt-1">Restricted access area</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-red-400 transition-colors"
                            placeholder="admin@editians.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-red-400 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/login')} className="text-xs text-slate-500 hover:text-slate-300">Back to public portal</button>
                </div>
            </div>
        </div>
    )
}
