import React from 'react'
import { useAuth } from '../context/AuthContext'
import ClientDashboard from './ClientDashboard'
import EditorDashboard from './EditorDashboard'
import { Navigate } from 'react-router-dom'

export default function DashboardRouter() {
    const { userData } = useAuth()

    // Fallback if userData is loading/missing, default to generic or check session
    const role = userData?.role || (sessionStorage.getItem('isAdmin') === 'true' ? 'admin' : null)

    if (role === 'client') {
        return <ClientDashboard />
    } else if (role === 'editor') {
        return <EditorDashboard />
    } else if (role === 'admin') {
        return <Navigate to="/admin" replace />
    } else {
        // Safe fallback in case we are in an intermediate loading state
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            </div>
        )
    }
}
