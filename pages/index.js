import { useState, useEffect } from 'react'
import Head from 'next/head'

const GENRE_CONFIG = {
  rock: { label: 'Rock', icon: '🎸', color: '#c0392b' },
  electro: { label: 'Électro', icon: '🎛', color: '#2980b9' },
  jazz: { label: 'Jazz', icon: '🎷', color: '#8e44ad' },
  pop: { label: 'Pop', icon: '🎤', color: '#27ae60' },
  metal: { label: 'Métal', icon: '🤘', color: '#7f8c8d' },
  autre: { label: 'Autre', icon: '🎵', color: '#555' },
}

const REGION_CONFIG = {
  'Occitanie': { color: '#c0392b', img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600&q=60' },
  'Auvergne-Rhône-Alpes': { color: '#2471a3', img: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=60' },
  'Provence-Alpes-Côte d\'Azur': { color: '#1e8449', img: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=60' },
}

function fp(p) { return p === 0 ? 'Gratuit' : p + ' €' }

export default function Home({ concerts: initialConcerts }) {
  const [concerts] = useState(initialConcerts || [])
  const [genre, setGenre] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('agenda')
  const [modal, setModal] = useState(null)
  const [qty, setQty] = useState({})
  const [slideIdx, setSlideIdx] = useState(0)

  const featured = concerts.filter(c => c.featured).slice(0, 5)
  const allFeatured = featured.length > 0 ? featured : concerts.slice(0, 5)

  useEffect(() => {
    if (allFeatured.length === 0) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % allFeatured.length), 5000)
    return () => clearInterval(t)
  }, [allFeatured.length])

  const filtered = concerts.filter(c => {
    const g = genre === 'all' || c.genre === genre
    const s = !search || [c.artist, c.city, c.region, c.venue]
      .some(t => t?.toLowerCase().includes(search.toLowerCase()))
    return g && s
  })

  const byMonth = filtered.reduce((acc, c) => {
    if (!acc[c.month]) acc[c.month] = []
    acc[c.month].push(c)
    return acc
  }, {})

  const byGenre = filtered.reduce((acc, c) => {
    if (!acc[c.genre]) acc[c.genre] = []
    acc[c.genre].push(c)
    return acc
  }, {})

  const byRegion = filtered.reduce((acc, c) => {
    const r = c.region || 'Autre'
    if (!acc[r]) acc[r] = []
    acc[r].push(c)
    return acc
  }, {})

  function openModal(c) {
    setModal(c)
    const q = {}
    ;(c.tiers || [{ n: 'Entrée générale', p: c.price }]).forEach((_, i) => q[i] = 0)
    setQty(q)
  }

  function changeQty(i, d) {
    setQty(prev => ({ ...prev, [i]: Math.max(0, (prev[i] || 0) + d) }))
  }

  const total = modal
    ? (modal.tiers || [{ n: 'Entrée générale', p: modal.price }])
        .reduce((s, t, i) => s + (qty[i] || 0) * t.p, 0)
    : 0

  const slide = allFeatured[slideIdx]

  function ConcertRow({ c }) {
    const cfg = GENRE_CONFIG[c.genre] || GENRE_CONFIG.autre
    const isSold = c.status === 'complet'
    return (
      <div onClick={() => openModal(c)} style={{
        display: 'grid', gridTemplateColumns: '52px 56px 1fr auto',
        alignItems: 'center', gap: '0 16px', padding: '11px 12px',
        borderRadius: 8, cursor: 'pointer', border: '1px solid transparent',
        transition: 'all .12s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#161616'; e.currentTarget.style.borderColor = '#2a2a2a' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.day}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#444' }}>{c.weekday}</div>
        </div>
        {c.image
          ? <img src={c.image} alt={c.artist} style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover' }} />
          : <div style={{ width: 56, height: 56, borderRadius: 6, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cfg.icon}</div>
        }
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.artist}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>📍 {c.venue}, {c.city}</span>
            <span>🕗 {c.time || '20h00'}</span>
            <span style={{ background: '#1a2030', color: '#5b9bd5', border: '1px solid #243050', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3 }}>{cfg.label}</span>
            {isSold && <span style={{ background: '#2e1414', color: '#e8412b', border: '1px solid #4a2020', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3 }}>Complet</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6
