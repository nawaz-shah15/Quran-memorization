import { useMemo, useState } from 'react'
import { useQuran } from '../context/QuranContext'

function NavigationPanel({ onJumpToVerse }) {
  const { verses, selectedSurah } = useQuran()
  const [view, setView] = useState('surah')
  const [jumpValue, setJumpValue] = useState('')

  const navigationItems = useMemo(() => {
    const items = []
    if (!verses.length) return items
    for (let index = 0; index < Math.min(verses.length, 12); index += 1) {
      items.push({ label: `Verse ${index + 1}`, index })
    }
    return items
  }, [verses])

  const handleJump = (event) => {
    event.preventDefault()
    const value = Number(jumpValue)
    if (Number.isInteger(value) && value >= 1 && value <= verses.length) {
      onJumpToVerse(value - 1)
      setJumpValue('')
    }
  }

  return (
    <div className="navigation-panel">
      <div className="navigation-header">
        <h3>Navigate</h3>
        <div className="navigation-tabs">
          <button className={view === 'surah' ? 'active' : ''} onClick={() => setView('surah')}>Surah</button>
          <button className={view === 'juz' ? 'active' : ''} onClick={() => setView('juz')}>Juz</button>
          <button className={view === 'page' ? 'active' : ''} onClick={() => setView('page')}>Page</button>
        </div>
      </div>

      <form className="navigation-jump" onSubmit={handleJump}>
        <input type="number" min="1" max={verses.length || 1} placeholder={`Jump to verse 1-${verses.length || 1}`} value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} />
        <button type="submit">Go</button>
      </form>

      <div className="navigation-content">
        {view === 'surah' && <p>{selectedSurah.number}. {selectedSurah.name}</p>}
        {view === 'juz' && <p>Juz navigation is ready for the next phase of expansion.</p>}
        {view === 'page' && <p>Page navigation is ready for the next phase of expansion.</p>}
        <div className="navigation-list">
          {navigationItems.map((item) => (
            <button key={item.index} onClick={() => onJumpToVerse(item.index)}>{item.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NavigationPanel
