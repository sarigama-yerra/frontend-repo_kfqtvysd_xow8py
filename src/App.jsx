import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

// Fix default marker icons for Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const categories = [
  { key: 'all', label: 'All' },
  { key: 'shop', label: 'Shops' },
  { key: 'cafe', label: 'Cafes' },
  { key: 'university', label: 'Universities' },
  { key: 'sports', label: 'Sports' },
]

function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-slate-900">H2Ok</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/" className="text-slate-700 hover:text-slate-900">Map</Link>
          <Link to="/updates" className="text-slate-700 hover:text-slate-900">Updates</Link>
          <Link to="/about" className="text-slate-700 hover:text-slate-900">About</Link>
          <a href="https://t.me/H2OK_tyumen" target="_blank" className="text-blue-600 font-semibold" rel="noreferrer">Telegram</a>
        </nav>
      </div>
    </div>
  )
}

function LocateButton({ onLocate }) {
  return (
    <button onClick={onLocate} className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow">
      My location
    </button>
  )
}

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13)
  }, [center, map])
  return null
}

function MapPage() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Default center: Tyumen
  const [center, setCenter] = useState([57.15303, 65.53433])
  const [category, setCategory] = useState('all')
  const [hasHot, setHasHot] = useState(false)
  const [hasCold, setHasCold] = useState(true)
  const [query, setQuery] = useState('')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const loadPartners = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (hasHot) params.set('has_hot', 'true')
      if (hasCold) params.set('has_cold', 'true')
      if (query) params.set('q', query)
      const res = await fetch(`${baseUrl}/api/partners?${params.toString()}`)
      const data = await res.json()
      setPartners(data.items || [])
    } catch (e) {
      setError('Failed to load points')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [category, hasHot, hasCold])

  const onLocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter([pos.coords.latitude, pos.coords.longitude])
    })
  }

  const markers = useMemo(() => partners.map(p => (
    <Marker key={p.id} position={[p.latitude, p.longitude]}>
      <Popup>
        <div className="space-y-1">
          <div className="font-semibold">{p.name} {p.is_new && <span className="ml-2 text-xs text-green-600">new</span>}</div>
          <div className="text-xs text-slate-600">{p.address}</div>
          {p.open_hours && <div className="text-xs">Hours: {p.open_hours}</div>}
          <div className="text-xs">Water: {p.has_cold ? 'cold' : ''} {p.has_hot ? '/ hot' : ''}</div>
          <div className="text-xs">Access: {p.access_type === 'free' ? 'free' : 'ask staff'}</div>
          <a className="text-blue-600 text-xs" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}>Directions</a>
        </div>
      </Popup>
    </Marker>
  )), [partners])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-r border-slate-200 p-4 space-y-4">
          <div className="flex gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search address or name" className="flex-1 px-3 py-2 border rounded" />
            <button onClick={loadPartners} className="px-3 py-2 bg-slate-900 text-white rounded">Search</button>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.key} onClick={()=>setCategory(c.key)} className={`px-3 py-1.5 rounded border text-sm ${category===c.key? 'bg-slate-900 text-white' : 'bg-white'}`}>{c.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasCold} onChange={e=>setHasCold(e.target.checked)} /> Cold</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasHot} onChange={e=>setHasHot(e.target.checked)} /> Hot</label>
          </div>
          <LocateButton onLocate={onLocate} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
        <div className="h[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter center={center} />
            {markers}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

function UpdatesPage() {
  const [items, setItems] = useState([])
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  useEffect(() => {
    fetch(`${baseUrl}/api/updates`).then(r=>r.json()).then(d=>setItems(d.items||[])).catch(()=>{})
  }, [])
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 space-y-4">
        <h1 className="text-2xl font-semibold">Updates</h1>
        {items.length===0 && <div className="text-slate-500">No updates yet</div>}
        <div className="space-y-4">
          {items.map(it => (
            <div key={it.id} className="border rounded p-4 bg-white">
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-slate-700 whitespace-pre-line">{it.content}</div>
              {it.external_url && <a className="text-blue-600 text-sm" target="_blank" rel="noreferrer" href={it.external_url}>Read more</a>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 space-y-4">
        <h1 className="text-2xl font-semibold">About the project</h1>
        <p className="text-slate-700">H2Ok helps you find free water refill points nearby. The MVP focuses on speed and clarity: an interactive map, a simple search, and useful updates.</p>
        <a href="https://t.me/H2OK_tyumen" target="_blank" rel="noreferrer" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded">Join our Telegram community</a>
      </div>
    </div>
  )
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Root
