import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Chat from './pages/Chat'
import AdminDashboard from './pages/AdminDashboard'
import Projects from './pages/Projects'
import DashboardRouter from './pages/DashboardRouter'
import Leaderboard from './pages/Leaderboard'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import NotificationManager from './components/NotificationManager'

function App() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-primary text-slate-200">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] pointer-events-none fixed" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-highlight/20 blur-[120px] pointer-events-none fixed" />

      <div className="relative z-10 w-full min-h-screen flex flex-col pt-16">
        <Header />
        <NotificationManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['client', 'editor', 'admin']}>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={['client', 'editor', 'admin']}>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute allowedRoles={['client', 'editor', 'admin']}>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute allowedRoles={['client', 'editor', 'admin']}>
              <Leaderboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  )
}

export default App
