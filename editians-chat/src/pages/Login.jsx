import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle, Camera, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useRef } from 'react'

export default function Login() {
    const navigate = useNavigate()
    const { loginWithGoogle, userData } = useAuth()
    const fileInputRef = useRef(null)

    const [role, setRole] = useState(null) // 'client' | 'editor'
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Custom auth flow sequence
    const [step, setStep] = useState('role') // 'role' | 'google' | 'profileSetup' | 'pin'
    const [tempGoogleUser, setTempGoogleUser] = useState(null)
    const [customName, setCustomName] = useState('')
    const [customPhoto, setCustomPhoto] = useState('')

    const initiateGoogleLogin = async () => {
        try {
            setError('')
            setLoading(true)

            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            // Check if user already exists
            const userRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                // New user! Go to profile setup step before finalizing in Context
                setTempGoogleUser(user)
                setCustomName(user.displayName || '')
                setCustomPhoto(user.photoURL || '')
                setStep('profileSetup')
                setLoading(false)
            } else {
                // Existing user, proceed with normal context login (which handles existing logic)
                await loginWithGoogle(role, null, null, user) // pass user to skip second popup
                setStep('pin')
                setLoading(false)
            }
        } catch (err) {
            setError(err.message || 'Failed to authenticate with Google.')
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            setError("File is too large. Choose an image under 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setCustomPhoto(event.target.result);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const finalizeProfileSetup = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            await loginWithGoogle(role, customName, customPhoto, tempGoogleUser)
            setStep('pin')
        } catch (err) {
            setError("Error creating profile.")
        } finally {
            setLoading(false)
        }
    }

    const handlePinAccess = async () => {
        try {
            setError('')
            setLoading(true)

            const q = query(collection(db, 'channels'), where('pin', '==', pin))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                throw new Error('Invalid PIN code.')
            }

            const channelData = querySnapshot.docs[0].data()
            const channelId = querySnapshot.docs[0].id

            sessionStorage.setItem('activeChannel', channelId)
            sessionStorage.setItem('channelName', channelData.name)

            navigate('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6" id="login-page">
            <div className="glass-panel w-full max-w-md pt-10 pb-12 px-8 relative overflow-hidden">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2 text-white">
                        {step === 'profileSetup' ? 'Create Profile' : 'Authentication'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {step === 'profileSetup' ? 'Stand out to your collaborators' : 'Select your role to continue'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {step === 'role' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => { setRole('client'); setStep('google'); }}
                            className="w-full glass hover:bg-white/10 text-white font-medium py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                        >
                            <span>I am a Client</span>
                            <LogIn size={20} className="text-accent" />
                        </button>
                        <button
                            onClick={() => { setRole('editor'); setStep('google'); }}
                            className="w-full glass hover:bg-white/10 text-white font-medium py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                        >
                            <span>I am an Editor</span>
                            <LogIn size={20} className="text-highlight" />
                        </button>
                        <div className="pt-4 mt-4 border-t border-white/10 text-center">
                            <button
                                onClick={() => navigate('/admin-login')}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Admin Login
                            </button>
                        </div>
                    </div>
                )}

                {step === 'google' && (
                    <div className="space-y-6 animate-in fade-in cursor-default">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                            <span>Logging in as <strong>{role === 'client' ? 'Client' : 'Editor'}</strong></span>
                            <button onClick={() => setStep('role')} className="hover:text-white underline">Back</button>
                        </div>

                        <button
                            onClick={initiateGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white text-slate-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            {loading ? 'Authenticating...' : 'Sign in with Google'}
                        </button>
                    </div>
                )}

                {step === 'profileSetup' && (
                    <form onSubmit={finalizeProfileSetup} className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="flex flex-col items-center mb-6">
                            <div
                                className="w-24 h-24 rounded-full bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative cursor-pointer group hover:border-accent/60 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {customPhoto ? (
                                    <img src={customPhoto} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="text-slate-500 group-hover:text-accent transition-colors" size={32} />
                                )}
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-2">
                                Click to Upload Avatar
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Display Name</label>
                            <input
                                type="text"
                                required
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-accent transition-colors"
                                placeholder="Your Name"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !customName}
                            className="btn-primary w-full py-3 mt-4"
                        >
                            {loading ? 'Saving...' : 'Complete Setup'}
                        </button>
                    </form>
                )}

                {step === 'pin' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold">Authenticated!</h3>
                            <p className="text-sm text-slate-400 mt-1">Hello, {userData?.displayName || 'User'}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Enter Channel PIN mapping</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full bg-black/20 border border-white/10 text-white font-mono text-center text-2xl tracking-[0.5em] rounded-lg p-3 outline-none focus:border-accent transition-colors"
                                placeholder="****"
                            />
                        </div>

                        <button
                            onClick={handlePinAccess}
                            disabled={pin.length !== 4 || loading}
                            className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Access Channel'}
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}
