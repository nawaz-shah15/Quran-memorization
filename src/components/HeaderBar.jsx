import { useState } from 'react'
import { useQuran } from '../context/QuranContext'
import { usePlayer, RECITERS, SPEEDS } from '../context/PlayerContext'
import { useStudy } from '../context/StudyContext'
import { useSettings, TRANSLATIONS } from '../context/SettingsContext'
import ExportModal from './ExportModal'

const SLEEP_PRESETS = [5, 10, 15, 30, 60]

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause chapter' },
  { key: '← →', desc: 'Prev / Next verse (focus mode)' },
  { key: '↑ ↓', desc: 'Prev / Next verse (focus mode)' },
  { key: 'Esc', desc: 'Exit focus mode / close panels' },
  { key: 'F', desc: 'Enter focus mode' },
  { key: 'B', desc: 'Bookmark current verse (focus mode)' },
]

export default function HeaderBar({ onJumpToVerse, verseCount, onDownloadAudio }) {
  const { selectedSurah, setSidebarOpen, loadTranslation, loadTransliteration } = useQuran()
  const {
    selectedReciter, selectReciter,
    playingAll, pausedAll,
    speed, setSpeed,
    sleepMinutes, setSleepMinutes,
    playAll, pauseAll, stopAll,
    versesRef,
  } = usePlayer()
  const {
    arabicFontSize, setArabicFontSize,
    englishFontSize, setEnglishFontSize,
    theme, setTheme,
    enterFocus,
  } = useStudy()
  const {
    selectedTranslation, setSelectedTranslation,
    showTranslit, setShowTranslit,
    isAudioDownloaded,
  } = useSettings()

  const [showSleep, setShowSleep] = useState(false)
  const [jumpVal, setJumpVal] = useState('')
  const [verseSearch, setVerseSearch] = useState('')
  const [showExport, setShowExport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showTranslations, setShowTranslations] = useState(false)
  const isActive = playingAll || pausedAll
  const audioDownloaded = isAudioDownloaded(selectedSurah.number)

  const handlePlayPause = () => { if (playingAll) pauseAll(); else playAll(versesRef.current) }
  const activateSleep = (m) => { setSleepMinutes(m); setShowSleep(false) }
  const cancelSleep = () => { setSleepMinutes(null); setShowSleep(false) }

  const handleJump = (e) => {
    e.preventDefault()
    const n = parseInt(jumpVal)
    if (n >= 1 && n <= verseCount) { onJumpToVerse(n - 1); setJumpVal('') }
  }

  const handleVerseSearch = (e) => {
    e.preventDefault()
    if (verseSearch.trim()) onJumpToVerse(verseSearch.trim(), true)
  }

  const handleSelectTranslation = (id) => {
    setSelectedTranslation(id)
    loadTranslation(id)
    setShowTranslations(false)
  }

  const handleTranslitToggle = () => {
    if (!showTranslit) loadTransliteration()
    setShowTranslit((v) => !v)
  }

  const currentTranslLabel = TRANSLATIONS.find((t) => t.id === selectedTranslation)?.label || 'Translation'

  return (
    <>
      <div className="header-wrapper">
        {/* ── Reciter + Speed + Sleep bar ── */}
        <div className="reciter-bar">
          <span className="reciter-label">Reciter</span>
          <div className="reciter-list" role="group" aria-label="Select reciter">
            {RECITERS.map((r) => (
              <button
                key={r.id}
                className={`reciter-btn ${selectedReciter === r.id ? 'active' : ''}`}
                onClick={() => selectReciter(r.id)}
                aria-pressed={selectedReciter === r.id}
                aria-label={r.label}
              >
                {r.name}
              </button>
            ))}
          </div>

          <span className="reciter-label" style={{ marginLeft: 'auto' }}>Speed</span>
          <div className="speed-list" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                aria-label={`${s}x speed`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="sleep-timer-wrapper">
            {sleepMinutes !== null
              ? <button className="sleep-btn active" onClick={cancelSleep} aria-label={`Sleep timer: ${sleepMinutes} minutes remaining, click to cancel`}>⏾ {sleepMinutes}m ✕</button>
              : <button className="sleep-btn" onClick={() => setShowSleep((v) => !v)} aria-label="Set sleep timer">⏾ Sleep</button>
            }
            {showSleep && (
              <div className="sleep-dropdown" role="menu">
                {SLEEP_PRESETS.map((m) => (
                  <button key={m} className="sleep-option" onClick={() => activateSleep(m)} role="menuitem">{m} min</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tools bar: font, theme, translation, translit, focus, search, jump, export ── */}
        <div className="tools-bar">
          <div className="font-controls" role="group" aria-label="Font size controls">
            <span className="reciter-label">Arabic</span>
            <button className="font-btn" onClick={() => setArabicFontSize((s) => Math.max(18, s - 2))} aria-label="Decrease Arabic font size">A−</button>
            <span className="font-size-val" aria-live="polite">{arabicFontSize}</span>
            <button className="font-btn" onClick={() => setArabicFontSize((s) => Math.min(48, s + 2))} aria-label="Increase Arabic font size">A+</button>
            <span className="reciter-label" style={{ marginLeft: 8 }}>Eng</span>
            <button className="font-btn" onClick={() => setEnglishFontSize((s) => Math.max(11, s - 1))} aria-label="Decrease English font size">A−</button>
            <span className="font-size-val" aria-live="polite">{englishFontSize}</span>
            <button className="font-btn" onClick={() => setEnglishFontSize((s) => Math.min(24, s + 1))} aria-label="Increase English font size">A+</button>
          </div>

          <button className="theme-btn" onClick={() => setTheme((t) => t === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

          {/* Translation selector */}
          <div className="translation-wrapper">
            <button className="translation-btn" onClick={() => setShowTranslations((v) => !v)} aria-expanded={showTranslations} aria-haspopup="listbox">
              🌐 {currentTranslLabel}
            </button>
            {showTranslations && (
              <div className="translation-dropdown" role="listbox" aria-label="Select translation">
                {TRANSLATIONS.map((t) => (
                  <button
                    key={t.id}
                    className={`translation-option ${selectedTranslation === t.id ? 'active' : ''}`}
                    onClick={() => handleSelectTranslation(t.id)}
                    role="option"
                    aria-selected={selectedTranslation === t.id}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transliteration toggle */}
          <button
            className={`translit-btn ${showTranslit ? 'active' : ''}`}
            onClick={handleTranslitToggle}
            aria-pressed={showTranslit}
            aria-label="Toggle transliteration"
          >
            Aā Translit
          </button>

          <button className="focus-mode-btn" onClick={() => enterFocus(0)} aria-label="Enter focus mode (F)">
            ⛶ Focus
          </button>

          {/* Audio download */}
          <button
            className={`download-btn ${audioDownloaded ? 'downloaded' : ''}`}
            onClick={() => !audioDownloaded && onDownloadAudio()}
            aria-label={audioDownloaded ? 'Audio cached offline' : 'Download audio for offline use'}
            title={audioDownloaded ? 'Audio available offline' : 'Cache audio for offline use'}
          >
            {audioDownloaded ? '✓ Offline' : '⬇ Cache Audio'}
          </button>

          <form className="verse-search-form" onSubmit={handleVerseSearch} role="search" aria-label="Search verses">
            <input
              className="verse-search-input"
              placeholder="Search verses…"
              value={verseSearch}
              onChange={(e) => setVerseSearch(e.target.value)}
              aria-label="Search verse text"
            />
            <button type="submit" className="verse-search-btn" aria-label="Search">🔍</button>
          </form>

          <form className="jump-form" onSubmit={handleJump} aria-label="Jump to verse">
            <input
              className="jump-input"
              type="number"
              min="1"
              max={verseCount}
              placeholder={`Go to verse (1–${verseCount})`}
              value={jumpVal}
              onChange={(e) => setJumpVal(e.target.value)}
              aria-label={`Jump to verse number, 1 to ${verseCount}`}
            />
            <button type="submit" className="jump-btn" aria-label="Go to verse">↵</button>
          </form>

          <button className="export-trigger-btn" onClick={() => setShowExport(true)} aria-label="Export memorization progress">
            📊 Export
          </button>

          <button className="shortcuts-btn" onClick={() => setShowShortcuts((v) => !v)} aria-label="Keyboard shortcuts" aria-expanded={showShortcuts}>
            ⌨️
          </button>
        </div>

        {/* ── Keyboard shortcuts panel ── */}
        {showShortcuts && (
          <div className="shortcuts-panel" role="tooltip" aria-label="Keyboard shortcuts">
            <div className="shortcuts-header">
              <span>Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} aria-label="Close shortcuts">✕</button>
            </div>
            <ul className="shortcuts-list">
              {SHORTCUTS.map((s) => (
                <li key={s.key}>
                  <kbd>{s.key}</kbd>
                  <span>{s.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Main header bar ── */}
        <div className="header-bar">
          <button className="menu-button" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
          <div className="title-info">
            <div className="school-title-pill">Anaya Al Basheer International School</div>
            <h1>{selectedSurah.number}. {selectedSurah.name}</h1>
            <h2>{selectedSurah.englishName}</h2>
          </div>
          <div className="top-controls">
            <button
              onClick={handlePlayPause}
              className="play-all-button"
              aria-label={playingAll ? 'Pause chapter' : pausedAll ? 'Resume chapter' : 'Play chapter'}
            >
              {playingAll ? '⏸ Pause' : pausedAll ? '▶ Resume' : '▶ Play Chapter'}
            </button>
            {isActive && (
              <button onClick={stopAll} className="stop-all-button" aria-label="Stop playback">⏹ Stop</button>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  )
}
