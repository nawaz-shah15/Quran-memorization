import './App.css'
import { useEffect, useRef, useCallback } from 'react'
import { QuranProvider, useQuran } from './context/QuranContext'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { StudyProvider, useStudy } from './context/StudyContext'
import { SettingsProvider, useSettings, cacheSet } from './context/SettingsContext'
import Sidebar from './components/Sidebar'
import HeaderBar from './components/HeaderBar'
import VerseList from './components/VerseList'
import FocusMode from './components/FocusMode'
import MemorizationPanel from './components/MemorizationPanel'
import NavigationPanel from './components/NavigationPanel'
import AudioProgressBar from './components/AudioProgressBar'
import OfflineStatus from './components/OfflineStatus'

function AppInner() {
  const { verses, loading, selectedSurah } = useQuran()
  const { versesRef, playAll, pauseAll, playingAll, pausedAll, stopAll, getAudioUrl } = usePlayer()
  const { theme, focusMode, enterFocus } = useStudy()
  const { addRecentSurah, markAudioDownloaded, isAudioDownloaded } = useSettings()
  const verseListRef = useRef(null)

  useEffect(() => { versesRef.current = verses }, [verses, versesRef])

  // Track recently visited surahs
  useEffect(() => {
    if (selectedSurah) addRecentSurah(selectedSurah)
  }, [selectedSurah, addRecentSurah])

  const handleJumpToVerse = (idxOrQuery, isSearch) => {
    verseListRef.current?.jumpTo(idxOrQuery, isSearch)
  }

  // Download all audio for current surah and cache in IndexedDB
  const handleDownloadAudio = useCallback(async () => {
    if (!verses.length || isAudioDownloaded(selectedSurah.number)) return
    try {
      await Promise.all(verses.map(async (verse) => {
        const url = getAudioUrl(verse)
        const cacheKey = `audio:${selectedSurah.number}:${verse.ayahNo}`
        const res = await fetch(url)
        const blob = await res.blob()
        await cacheSet('audio', cacheKey, blob)
      }))
      markAudioDownloaded(selectedSurah.number)
    } catch (e) {
      console.error('Audio download failed:', e)
    }
  }, [verses, selectedSurah, getAudioUrl, markAudioDownloaded, isAudioDownloaded])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // Don't fire when typing in inputs/textareas
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (focusMode) return // FocusMode handles its own keys

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (playingAll) pauseAll()
          else playAll(versesRef.current)
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          // handled by FocusMode when active
          break
        case 'f':
        case 'F':
          enterFocus(0)
          break
        case 'Escape':
          stopAll()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playingAll, pausedAll, focusMode, playAll, pauseAll, stopAll, enterFocus, versesRef])

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar />
      <main className="main-content" id="main-content" role="main" aria-label={`${selectedSurah.name} verses`}>
        <HeaderBar
          onJumpToVerse={handleJumpToVerse}
          verseCount={verses.length}
          onDownloadAudio={handleDownloadAudio}
        />
        <OfflineStatus />
        <AudioProgressBar />
        <div className="app-spotlight">
          <div className="feature-grid">
            <MemorizationPanel />
            <NavigationPanel onJumpToVerse={handleJumpToVerse} />
          </div>
        </div>
        {loading
          ? <p className="loading" role="status" aria-live="polite">Loading...</p>
          : <VerseList ref={verseListRef} />
        }
      </main>
      {focusMode && <FocusMode />}
    </div>
  )
}

export default function App() {
  return (
    <QuranProvider>
      <PlayerProvider>
        <StudyProvider>
          <SettingsProvider>
            <AppInner />
          </SettingsProvider>
        </StudyProvider>
      </PlayerProvider>
    </QuranProvider>
  )
}
