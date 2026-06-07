import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userData } = useAuth();

    // Hardcoded Admin Override
    if (allowedRoles.includes('admin') && sessionStorage.getItem('isAdmin') === 'true') {
        return children;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
        // Role not allowed (e.g., client trying to access admin dashboard)
        if (userData.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/chat" replace />;
    }

    return children;
}
