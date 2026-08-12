import { NavLink, Outlet } from 'react-router-dom'
import { Calendar, TrendingUp, Dumbbell, ClipboardCheck, Utensils, Camera, BookOpen, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BottomNav from './BottomNav'

const desktopLinks = [
  { to: '/', label: 'Today', icon: Calendar },
  { to: '/menu', label: 'Menu', icon: Utensils },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/checkin', label: 'Check-in', icon: ClipboardCheck },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/photos', label: 'Photos', icon: Camera },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm">
              F
            </div>
            <span className="font-semibold tracking-tight">Fitness Tracker</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {desktopLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => signOut()}
              className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              title={user?.email}
            >
              <LogOut size={16} />
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
