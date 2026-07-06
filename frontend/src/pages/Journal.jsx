import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDateISO } from '../lib/schedule'

export default function Journal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('fitness_journal')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) load()
  }, [user])

  const addEntry = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    const { error } = await supabase.from('fitness_journal').insert({
      user_id: user.id,
      entry_date: formatDateISO(new Date()),
      title: title.trim() || null,
      content: content.trim(),
      mood: mood.trim() || null,
    })
    if (!error) {
      setTitle('')
      setContent('')
      setMood('')
      load()
    }
  }

  const deleteEntry = async (id) => {
    await supabase.from('fitness_journal').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Journal</h1>
        <p className="text-sm text-zinc-500">Training notes, reflections, weekly reviews</p>
      </div>

      <form onSubmit={addEntry} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <textarea
          placeholder="What's on your mind?"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <input
          placeholder="Mood (optional)"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500">
          <Plus size={16} />
          Add entry
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  {entry.title && <h3 className="font-medium">{entry.title}</h3>}
                  <p className="text-xs text-zinc-500">
                    {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                    {entry.mood && ` · ${entry.mood}`}
                  </p>
                </div>
                <button type="button" onClick={() => deleteEntry(entry.id)} className="text-zinc-600 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{entry.content}</p>
            </li>
          ))}
          {!entries.length && (
            <li className="py-8 text-center text-zinc-500">No journal entries yet.</li>
          )}
        </ul>
      )}
    </div>
  )
}
