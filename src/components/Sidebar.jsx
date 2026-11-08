import { useQuran } from '../context/QuranContext'
import { useSettings } from '../context/SettingsContext'

export default function Sidebar() {
  const { filteredSurahs, selectedSurah, selectSurah, searchQuery, setSearchQuery, sidebarOpen, setSidebarOpen } = useQuran()
  const { recentSurahs } = useSettings()

  const handleSelect = (surah) => selectSurah(surah)

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Surah list">
      <div className="sidebar-header">
        <h2>Quran Chapters</h2>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">×</button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search chapter"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search surahs"
        />
      </div>

      {!searchQuery && recentSurahs.length > 0 && (
        <div className="sidebar-recent">
          <span className="sidebar-section-label">Recently Visited</span>
          <ul className="sidebar-recent-list">
            {recentSurahs.map((surah) => (
              <li
                key={surah.number}
                className={`recent-item ${selectedSurah.number === surah.number ? 'active' : ''}`}
                onClick={() => handleSelect(surah)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(surah)}
                aria-label={`${surah.number}. ${surah.name}`}
              >
                <span className="recent-num">{surah.number}</span>
                <span className="recent-name">{surah.name}</span>
              </li>
            ))}
          </ul>
          <div className="sidebar-divider" />
        </div>
      )}

      <ul>
        {filteredSurahs.map((surah) => (
          <li
            key={surah.number}
            className={selectedSurah.number === surah.number ? 'active' : ''}
            onClick={() => handleSelect(surah)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(surah)}
            aria-label={`${surah.number}. ${surah.name}, ${surah.englishName}`}
            aria-current={selectedSurah.number === surah.number ? 'page' : undefined}
          >
            {surah.number}. {surah.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
