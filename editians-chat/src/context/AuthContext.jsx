import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loginWithGoogle = async (role, customName = null, customPhoto = null, preAuthUser = null) => {
        let user = preAuthUser;

        if (!user) {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            user = result.user;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // First time login - register them and assign the initial role they picked
            const newUserData = {
                email: user.email,
                displayName: customName || user.displayName,
                photoURL: customPhoto || user.photoURL || '',
                role: role,
                createdAt: new Date(),
                assignedChannels: []
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
        } else {
            // Existing user
            setUserData(userSnap.data());
        }

        return user;
    };

    const loginAdmin = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Admins need a user document too, or we manage them separately.
        // Let's assume an admin has a 'role: admin' document manually created or inferred.
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setUserData(userSnap.data());
        }

        return user;
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        loginWithGoogle,
        loginAdmin,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
