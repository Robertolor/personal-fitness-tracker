import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDateISO } from '../lib/schedule'

const BUCKET = 'progress-photos'

export default function ProgressPhotos() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [urls, setUrls] = useState({})
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadPhotos()
  }, [user])

  const loadPhotos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('photo_date', { ascending: false })
    setPhotos(data ?? [])

    const signed = {}
    for (const photo of data ?? []) {
      const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(photo.storage_path, 3600)
      if (signedData?.signedUrl) signed[photo.id] = signedData.signedUrl
    }
    setUrls(signed)
    setLoading(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setMessage('')
    try {
      const todayISO = formatDateISO(new Date())
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${todayISO}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('progress_photos').insert({
        user_id: user.id,
        photo_date: todayISO,
        storage_path: path,
        caption: caption || null,
      })
      if (insertError) throw insertError

      setCaption('')
      setMessage('Foto guardada.')
      await loadPhotos()
    } catch (err) {
      setMessage(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const dayOnePhoto = photos[photos.length - 1]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fotos de progreso</h1>
        <p className="text-sm text-zinc-500">Sube a diario, compara cada 1-2 semanas contra el Día 1</p>
      </div>

      <details className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
        <summary className="cursor-pointer font-medium text-amber-500/80">Condiciones para que las fotos sirvan de verdad</summary>
        <ul className="mt-2 space-y-1.5 list-disc pl-4 text-xs">
          <li>Misma hora del día siempre - recomendado en ayunas, recién despierto.</li>
          <li>Mismo fondo, misma luz (evita luz directa dura que crea sombras engañosas).</li>
          <li>Misma distancia de cámara y las mismas 2-3 poses fijas (frente, lado, espalda).</li>
          <li>Ropa mínima consistente (mismo short/ropa interior cada vez).</li>
          <li>Pide comparación real cada 1-2 semanas, siempre contra el Día 1 - el cambio de una semana suele ser sutil y poco confiable en foto.</li>
        </ul>
      </details>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Camera className="text-emerald-400" size={20} />
          <h2 className="font-semibold">Foto de hoy</h2>
        </div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Nota opcional (ej. 'hinchado, mala noche de sueño')"
          className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-500">
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {uploading ? 'Subiendo…' : 'Subir foto'}
          <input type="file" accept="image/*" capture="environment" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
        {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Historial</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando…</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay fotos. Sube la primera para tener tu referencia de Día 1.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
                {urls[photo.id] ? (
                  <img src={urls[photo.id]} alt={photo.caption ?? photo.photo_date} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-zinc-600">
                    <Camera size={24} />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-zinc-400">{format(parseISO(photo.photo_date), 'MMM d')}</p>
                  {photo === dayOnePhoto && <span className="text-[10px] text-emerald-400">Día 1 (referencia)</span>}
                  {photo.caption && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{photo.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
