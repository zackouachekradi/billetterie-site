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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff' }}>{fp(c.price)}</div>
          {isSold
            ? <span style={{ fontSize: 12, color: '#444', border: '1px solid #2a2a2a', padding: '6px 14px', borderRadius: 4 }}>Complet</span>
            : <button onClick={e => { e.stopPropagation(); openModal(c) }} style={{ background: '#e8412b', color: '#fff', border: 'none', fontFamily: "'Barlow',sans-serif", fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 4, cursor: 'pointer' }}>Acheter →</button>
          }
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Sud Concerts — Billetterie</title>
        <meta name="description" content="Agenda concerts et billetterie en ligne" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: '#0e0e0e', color: '#f0ede8', fontFamily: "'Barlow',sans-serif", minHeight: '100vh' }}>

        {/* HEADER */}
        <header style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', position: 'sticky', top: 0, zIndex: 200 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: '#e8412b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 800, letterSpacing: '.05em', color: '#fff', textTransform: 'uppercase' }}>
                Sud<span style={{ color: '#e8412b' }}>Concerts</span>
              </span>
            </div>
            <nav style={{ display: 'flex', gap: 4 }}>
              {['Agenda', 'Artistes', 'Régions', 'Contact'].map(n => (
                <a key={n} href="#" style={{ color: '#888', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 13px', borderRadius: 4 }}>{n}</a>
              ))}
              <a href="#" style={{ background: '#e8412b', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '6px 13px', borderRadius: 4 }}>Mes billets</a>
            </nav>
          </div>
        </header>

        {/* SLIDESHOW */}
        {slide && (
          <div style={{ position: 'relative', height: 400, overflow: 'hidden', background: '#000' }}>
            <img src={slide.image || `https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80`}
              alt={slide.artist} style={{ position: 'absolute', right: 0, top: 0, width: '62%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#0e0e0e 32%,rgba(14,14,14,.65) 58%,rgba(14,14,14,.05) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 2, padding: '52px', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5a623' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#f5a623' }}>
                  {GENRE_CONFIG[slide.genre]?.label || ''} · {slide.region}
                </span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 'clamp(42px,5.5vw,68px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: .92, marginBottom: 16 }}>{slide.artist}</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📅 {slide.dateFormatted}</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 22 }}>📍 {slide.venue}, {slide.city}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24 }}>
                <span style={{ fontSize: 13, color: '#888', fontFamily: "'Barlow',sans-serif", fontWeight: 400, marginRight: 8 }}>À partir de</span>
                {fp(slide.price)}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => openModal(slide)} style={{ background: '#e8412b', color: '#fff', border: 'none', fontFamily: "'Barlow',sans-serif", fontSize: 14, fontWeight: 600, padding: '11px 26px', borderRadius: 5, cursor: 'pointer' }}>Réserver →</button>
                <button onClick={() => openModal(slide)} style={{ background: 'rgba(255,255,255,.07)', color: '#888', border: '1px solid rgba(255,255,255,.12)', fontFamily: "'Barlow',sans-serif", fontSize: 14, padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>En savoir plus</button>
              </div>
            </div>
            {/* dots */}
            <div style={{ position: 'absolute', bottom: 20, left: 52, display: 'flex', gap: 6, zIndex: 10 }}>
              {allFeatured.map((_, i) => (
                <div key={i} onClick={() => setSlideIdx(i)} style={{ width: i === slideIdx ? 22 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? '#e8412b' : 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'all .35s' }} />
              ))}
            </div>
            <button onClick={() => setSlideIdx(i => (i - 1 + allFeatured.length) % allFeatured.length)}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 16, zIndex: 10 }}>←</button>
            <button onClick={() => setSlideIdx(i => (i + 1) % allFeatured.length)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 16, zIndex: 10 }}>→</button>
          </div>
        )}

        {/* TOOLBAR */}
        <div style={{ borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#444', marginRight: 4 }}>Genre</span>
            {[['all', 'Tous'], ['rock', 'Rock'], ['electro', 'Électro'], ['jazz', 'Jazz'], ['pop', 'Pop'], ['metal', 'Métal']].map(([val, label]) => (
              <button key={val} onClick={() => setGenre(val)} style={{
                background: genre === val ? '#e8412b' : 'transparent',
                border: `1px solid ${genre === val ? '#e8412b' : '#2a2a2a'}`,
                color: genre === val ? '#fff' : '#444',
                fontFamily: "'Barlow',sans-serif", fontSize: 12, fontWeight: 600,
                padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
              }}>{label}</button>
            ))}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 13 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Artiste, ville, région…"
                style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#f0ede8', fontFamily: "'Barlow',sans-serif", fontSize: 13, padding: '7px 14px 7px 34px', borderRadius: 6, width: 220, outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        <div style={{ borderBottom: '1px solid #2a2a2a', background: '#161616' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex' }}>
            {[
              { key: 'agenda', icon: '📅', label: 'Agenda', desc: 'Classement chronologique' },
              { key: 'genre', icon: '🎵', label: 'Par genre', desc: 'Rock, Électro, Jazz…' },
              { key: 'region', icon: '📍', label: 'Par région', desc: 'Occitanie, PACA, ARA…' },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '14px 28px', background: 'none', border: 'none',
                borderBottom: view === v.key ? '2px solid #e8412b' : '2px solid transparent',
                color: view === v.key ? '#fff' : '#444', cursor: 'pointer', transition: 'all .2s',
                fontFamily: "'Barlow',sans-serif",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: view === v.key ? 'rgba(232,65,43,.15)' : '#1e1e1e', border: `1px solid ${view === v.key ? 'rgba(232,65,43,.35)' : '#2a2a2a'}` }}>{v.icon}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: view === v.key ? 'rgba(232,65,43,.7)' : '#444', marginTop: 1 }}>{v.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px 72px' }}>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: '#444' }}>Aucun concert pour cette sélection.</div>
          )}

          {/* AGENDA VIEW */}
          {view === 'agenda' && Object.entries(byMonth).map(([month, cs]) => (
            <div key={month} style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: '#444', padding: '12px 0 10px' }}>
                {month} — {cs.length} concert{cs.length > 1 ? 's' : ''}
                <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
              </div>
              {cs.map(c => <ConcertRow key={c.id} c={c} />)}
            </div>
          ))}

          {/* GENRE VIEW */}
          {view === 'genre' && Object.entries(byGenre).map(([g, cs]) => {
            const cfg = GENRE_CONFIG[g] || GENRE_CONFIG.autre
            return (
              <div key={g} style={{ marginTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: cfg.color + '20', border: `1px solid ${cfg.color}40` }}>{cfg.icon}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>{cfg.label}</div>
                  <div style={{ flex: 1, height: 1, background: '#2a2a2a', marginLeft: 12 }} />
                  <div style={{ fontSize: 11, color: '#444', background: '#1e1e1e', border: '1px solid #2a2a2a', padding: '2px 10px', borderRadius: 12 }}>{cs.length} date{cs.length > 1 ? 's' : ''}</div>
                </div>
                {cs.map(c => <ConcertRow key={c.id} c={c} />)}
              </div>
            )
          })}

          {/* REGION VIEW */}
          {view === 'region' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20, marginTop: 28 }}>
              {Object.entries(byRegion).map(([region, cs]) => {
                const cfg = REGION_CONFIG[region] || { color: '#555', img: '' }
                const cities = [...new Set(cs.map(c => c.city))].join(', ')
                return (
                  <div key={region} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 100, background: '#1e1e1e' }}>
                      {cfg.img && <img src={cfg.img} alt={region} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .35 }} />}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(232,65,43,.15),rgba(0,0,0,.4))' }} />
                      <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '3px 9px', borderRadius: 10 }}>{cs.length} concert{cs.length > 1 ? 's' : ''}</div>
                      <div style={{ position: 'absolute', bottom: 14, left: 18 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{region}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{cities}</div>
                      </div>
                    </div>
                    <div>
                      {cs.map(c => (
                        <div key={c.id} onClick={() => openModal(c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 18px', cursor: 'pointer', borderTop: '1px solid #2a2a2a', gap: 14 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                            {c.image
                              ? <img src={c.image} alt={c.artist} style={{ width: 38, height: 38, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 38, height: 38, borderRadius: 5, background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎵</div>
                            }
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.artist}</div>
                              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{c.venue}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{fp(c.price)}</div>
                            <div style={{ fontSize: 10, color: '#444' }}>{c.weekday} {c.day}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* MODAL */}
        {modal && (
          <div onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' }}>
              {/* Hero */}
              <div style={{ position: 'relative', height: 190, overflow: 'hidden', borderRadius: '12px 12px 0 0', background: '#1e1e1e' }}>
                <img src={modal.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80'} alt={modal.artist} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(22,22,22,1) 0%,rgba(22,22,22,.35) 100%)' }} />
                <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>✕</button>
                <div style={{ position: 'absolute', bottom: 16, left: 24 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{modal.artist}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{GENRE_CONFIG[modal.genre]?.label}</div>
                </div>
              </div>
              {/* Infos */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {[
                    ['📅 Date', modal.dateFormatted],
                    ['📍 Lieu', `${modal.venue} — ${modal.city}`],
                    ['🕗 Heure', modal.time || '20h00'],
                    ['🎟 Dispo', modal.status === 'complet' ? 'Complet' : modal.status === 'dernieres places' ? 'Dernières places' : 'Billets disponibles'],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 7, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#444', marginBottom: 4 }}>{lbl}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Billetweb embed ou tickets */}
                {modal.billetweb ? (
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                    <div style={{ padding: '11px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#444' }}>Billetterie</span>
                      <span style={{ fontSize: 10, color: '#444' }}>Propulsé par Billetweb</span>
                    </div>
                    <iframe
                      src={`https://www.billetweb.fr/shop/${modal.billetweb}`}
                      width="100%"
                      height="420"
                      frameBorder="0"
                      scrolling="auto"
                      style={{ display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', borderBottom: '1px solid #2a2a2a' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#444' }}>Choisissez vos billets</span>
                    </div>
                    {[{ n: 'Entrée générale', p: modal.price }].map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{t.n}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>{fp(t.p)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <button onClick={() => changeQty(i, -1)} style={{ width: 26, height: 26, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}>−</button>
                            <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: 'center' }}>{qty[i] || 0}</span>
                            <button onClick={() => changeQty(i, 1)} style={{ width: 26, height: 26, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}>+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!modal.billetweb && (
                <div style={{ padding: '14px 24px 22px', borderTop: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Total</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, color: '#fff' }}>{total === 0 ? '0 €' : total + ' €'}</div>
                  </div>
                  <button style={{ background: '#e8412b', color: '#fff', border: 'none', fontFamily: "'Barlow',sans-serif", fontSize: 14, fontWeight: 700, padding: '13px 30px', borderRadius: 6, cursor: 'pointer' }}>
                    Valider →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer style={{ background: '#161616', borderTop: '1px solid #2a2a2a', padding: 26 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ fontSize: 12, color: '#444' }}>© 2025 Sud Concerts — Tous droits réservés</div>
            <div style={{ display: 'flex', gap: 18 }}>
              {['Mentions légales', 'CGV', 'Contact'].map(l => <a key={l} href="#" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>{l}</a>)}
            </div>
            <div style={{ fontSize: 12, color: '#444' }}>Billetterie <strong style={{ color: '#888' }}>Billetweb</strong></div>
          </div>
        </footer>

      </div>
    </>
  )
}

export async function getStaticProps() {
  const { getConcerts } = await import('../lib/notion')
  const concerts = await getConcerts()
  return {
    props: { concerts },
    revalidate: 60,
  }
}
