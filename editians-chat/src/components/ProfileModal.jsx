import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Camera, Save } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
    const { currentUser, userData } = useAuth();

    // Setup state only when modal opens
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState('');
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    // Sync state when modal toggles open
    React.useEffect(() => {
        if (isOpen && userData) {
            setName(userData.displayName || '');
            setPhoto(userData.photoURL || '');
        }
    }, [isOpen, userData]);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            alert("File is too large. Choose an image under 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setPhoto(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update Firestore user document
            if (currentUser?.uid) {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    displayName: name,
                    photoURL: photo
                });
            }

            // Also update Firebase Auth Profile (Good practice)
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: name,
                    photoURL: photo
                });
            }

            // Close modal immediately to avoid a full reload flash
            onClose();
            // Force a hard reload of the page after they close it to purge the app state and refetch cleanly.
            // A more elegant solution uses React Context dispatch but this relies purely on Firebase refresh mechanics.
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert("Failed to update profile. " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Make sure we handle admins properly. Admins use a strict /logo.png format in the rendering logic regardless,
    // but allowing them to change their name here is still highly useful.
    const isAdminSession = sessionStorage.getItem('isAdmin') === 'true';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative shadow-2xl animate-in zoom-in-95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden mb-2 group-hover:border-accent/60 transition-colors">
                                {photo ? (
                                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="text-slate-400 group-hover:text-accent transition-colors" size={32} />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-2">
                            {isAdminSession ? '(Admins always show the site logo in Chat)' : 'Click to Upload Avatar'}
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
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Display Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-accent transition-colors"
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} /> Save Profile Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
