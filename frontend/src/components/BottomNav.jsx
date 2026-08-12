import { NavLink } from 'react-router-dom'
import { Calendar, TrendingUp, Dumbbell, ClipboardCheck, Utensils, Camera, BookOpen, Settings } from 'lucide-react'

const links = [
  { to: '/', label: 'Today', icon: Calendar },
  { to: '/menu', label: 'Menu', icon: Utensils },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/checkin', label: 'Check-in', icon: ClipboardCheck },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/photos', label: 'Photos', icon: Camera },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden">
      <ul className="flex justify-around gap-0.5 overflow-x-auto px-1 py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
