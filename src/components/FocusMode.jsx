import { useEffect } from 'react'
import { useQuran } from '../context/QuranContext'
import { usePlayer } from '../context/PlayerContext'
import { useStudy, PROGRESS_STATES, PROGRESS_LABELS, PROGRESS_COLORS } from '../context/StudyContext'

export default function FocusMode() {
  const { verses, selectedSurah } = useQuran()
  const { playSingleVerse, stopSingleVerse, playingVerseIndex } = usePlayer()
  const {
    focusIndex, setFocusIndex, exitFocus,
    arabicFontSize, englishFontSize,
    hiddenArabic, toggleHideArabic,
    hiddenTranslation, toggleHideTranslation,
    getVerseProgress, setVerseProgress,
    isBookmarked, toggleBookmark,
  } = useStudy()

  const verse = verses[focusIndex]
  const total = verses.length
  const isPlaying = playingVerseIndex === focusIndex

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setFocusIndex((i) => Math.min(i + 1, total - 1))
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setFocusIndex((i) => Math.max(i - 1, 0))
      if (e.key === 'Escape') exitFocus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitFocus, setFocusIndex, total])

  if (!verse) return null

  const prog = getVerseProgress(selectedSurah.number, verse.ayahNo)
  const nextProg = PROGRESS_STATES[(PROGRESS_STATES.indexOf(prog) + 1) % PROGRESS_STATES.length]

  const handlePlay = () => {
    if (isPlaying) stopSingleVerse()
    else playSingleVerse(focusIndex, verse, () => {})
  }

  return (
    <div className="focus-overlay">
      <div className="focus-modal">
        <div className="focus-top">
          <span className="focus-surah">{selectedSurah.name} — {focusIndex + 1} / {total}</span>
          <div className="focus-top-actions">
            <button
              className="focus-bookmark"
              onClick={() => toggleBookmark(selectedSurah.number, verse.ayahNo)}
              title="Bookmark"
            >
              {isBookmarked(selectedSurah.number, verse.ayahNo) ? '🔖' : '🏷️'}
            </button>
            <button
              className="focus-progress-btn"
              style={{ color: PROGRESS_COLORS[prog] }}
              onClick={() => setVerseProgress(selectedSurah.number, verse.ayahNo, nextProg)}
              title="Cycle progress"
            >
              {PROGRESS_LABELS[prog]}
            </button>
            <button className="focus-close" onClick={exitFocus}>✕</button>
          </div>
        </div>

        <div className="focus-verse-number">{verse.ayahNo}</div>

        {hiddenArabic[focusIndex] ? (
          <div className="focus-hidden-block" onClick={() => toggleHideArabic(focusIndex)}>
            Tap to reveal Arabic
          </div>
        ) : (
          <p className="focus-arabic" style={{ fontSize: arabicFontSize * 1.4 + 'px' }}
            onClick={() => toggleHideArabic(focusIndex)}>
            {verse.arabic1}
          </p>
        )}

        {hiddenTranslation[focusIndex] ? (
          <div className="focus-hidden-block" onClick={() => toggleHideTranslation(focusIndex)}>
            Tap to reveal Translation
          </div>
        ) : (
          <p className="focus-english" style={{ fontSize: englishFontSize + 'px' }}
            onClick={() => toggleHideTranslation(focusIndex)}>
            {verse.english}
          </p>
        )}

        <div className="focus-controls">
          <button className="focus-nav" onClick={() => setFocusIndex((i) => Math.max(i - 1, 0))} disabled={focusIndex === 0}>← Prev</button>
          <button className={`focus-play ${isPlaying ? 'active' : ''}`} onClick={handlePlay}>
            {isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <button className="focus-nav" onClick={() => setFocusIndex((i) => Math.min(i + 1, total - 1))} disabled={focusIndex === total - 1}>Next →</button>
        </div>

        <div className="focus-hint">← → arrow keys to navigate · Esc to exit · tap text to hide/reveal</div>
      </div>
    </div>
  )
}
