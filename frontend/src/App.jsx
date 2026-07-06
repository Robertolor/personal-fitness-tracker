import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Today from './pages/Today'
import Progress from './pages/Progress'
import LogWorkout from './pages/LogWorkout'
import CheckIn from './pages/CheckIn'
import Settings from './pages/Settings'
import Journal from './pages/Journal'
import { Loader2 } from 'lucide-react'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Today />} />
        <Route path="progress" element={<Progress />} />
        <Route path="workout" element={<LogWorkout />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="settings" element={<Settings />} />
        <Route path="journal" element={<Journal />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
