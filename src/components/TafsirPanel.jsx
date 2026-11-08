import { useState, useEffect } from 'react'

const TAFSIR_EDITIONS = [
  { id: 'en.maududi', label: 'Maududi (EN)' },
  { id: 'en.muyassar', label: 'Muyassar (EN)' },
]

export default function TafsirPanel({ surahNo, ayahNo, onClose }) {
  const [edition, setEdition] = useState(TAFSIR_EDITIONS[0].id)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setText('')
    fetch(`https://api.alquran.cloud/v1/ayah/${surahNo}:${ayahNo}/${edition}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.code === 200) setText(d.data.text)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [surahNo, ayahNo, edition])

  return (
    <div className="tafsir-panel">
      <div className="tafsir-header">
        <span className="tafsir-title">Tafsir — Verse {ayahNo}</span>
        <div className="tafsir-edition-list">
          {TAFSIR_EDITIONS.map((e) => (
            <button
              key={e.id}
              className={`tafsir-edition-btn ${edition === e.id ? 'active' : ''}`}
              onClick={() => setEdition(e.id)}
            >
              {e.label}
            </button>
          ))}
        </div>
        <button className="tafsir-close" onClick={onClose}>✕</button>
      </div>
      <div className="tafsir-body">
        {loading && <span className="tafsir-loading">Loading…</span>}
        {error && <span className="tafsir-error">Could not load tafsir.</span>}
        {!loading && !error && text && <p className="tafsir-text">{text}</p>}
      </div>
    </div>
  )
}
