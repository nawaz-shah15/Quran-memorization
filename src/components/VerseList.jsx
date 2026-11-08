import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useQuran } from '../context/QuranContext'
import { usePlayer } from '../context/PlayerContext'
import { useStudy, PROGRESS_STATES, PROGRESS_LABELS, PROGRESS_COLORS } from '../context/StudyContext'
import { useSettings } from '../context/SettingsContext'
import { getNextRepeatProgress } from '../utils/memorization'
import TafsirPanel from './TafsirPanel'

// ── Word-level highlight helpers ──────────────────────────────────────────────

async function detectSpeechWindow(url) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buf = await fetch(url).then((r) => r.arrayBuffer())
    const audioBuffer = await ctx.decodeAudioData(buf)
    ctx.close()
    const data = audioBuffer.getChannelData(0)
    const sr = audioBuffer.sampleRate
    const ws = Math.floor(sr * 0.02)
    const thr = 0.01
    let start = 0, end = audioBuffer.duration
    for (let i = 0; i < data.length - ws; i += ws) {
      let rms = 0
      for (let j = i; j < i + ws; j++) rms += data[j] * data[j]
      if (Math.sqrt(rms / ws) > thr) { start = i / sr; break }
    }
    for (let i = data.length - ws; i >= 0; i -= ws) {
      let rms = 0
      for (let j = i; j < i + ws; j++) rms += data[j] * data[j]
      if (Math.sqrt(rms / ws) > thr) { end = (i + ws) / sr; break }
    }
    return { start, end }
  } catch { return null }
}

function buildThresholds(words, speechStart, speechEnd) {
  const lengths = words.map((w) => w.replace(/\s/g, '').length || 1)
  const total = lengths.reduce((a, b) => a + b, 0)
  let cum = 0
  return lengths.map((l) => { cum += l; return speechStart + (cum / total) * (speechEnd - speechStart) })
}

function ArabicText({ text, audio, isPlaying, audioUrl, fontSize }) {
  const words = text.split(' ').filter(Boolean)
  const [hi, setHi] = useState(-1)
  const rafRef = useRef(null)
  const thresholdsRef = useRef([])
  const winRef = useRef(null)

  useEffect(() => {
    winRef.current = null; thresholdsRef.current = []
    if (audioUrl) detectSpeechWindow(audioUrl).then((w) => { winRef.current = w })
  }, [audioUrl, words])

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    if (!isPlaying || !audio) { setHi(-1); return }
    const tick = () => {
      if (!audio || audio.paused || audio.ended) { setHi(-1); return }
      if (audio.duration > 0) {
        if (thresholdsRef.current.length !== words.length) {
          const w = winRef.current
          thresholdsRef.current = buildThresholds(words, w?.start ?? 0, w?.end ?? audio.duration)
        }
        const idx = thresholdsRef.current.findIndex((t) => audio.currentTime < t)
        setHi(idx === -1 ? words.length - 1 : idx)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    thresholdsRef.current = []
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, audio])

  return (
    <p className="arabic" style={{ fontSize: fontSize + 'px' }}>
      {words.map((word, i) => (
        <span key={i} className={`arabic-word${hi === i ? ' word-highlight' : ''}`}>{word} </span>
      ))}
    </p>
  )
}

// ── Repeat single-verse control ───────────────────────────────────────────────

const REPEAT_PRESETS = [2, 5, 10, 15]

function RepeatControl({ repeatCount, setRepeatCount }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customVal, setCustomVal] = useState('')
  const isInfinite = repeatCount === Infinity
  const isCustomActive = !REPEAT_PRESETS.includes(repeatCount) && repeatCount > 1 && !isInfinite

  const submit = (e) => {
    e.preventDefault()
    const n = parseInt(customVal)
    if (n > 0) { setRepeatCount(n); setShowCustom(false); setCustomVal('') }
  }

  return (
    <div className="repeat-control">
      <span className="repeat-label">🔁</span>
      {REPEAT_PRESETS.map((n) => (
        <button key={n} className={`repeat-btn ${repeatCount === n ? 'active' : ''}`} onClick={() => setRepeatCount(repeatCount === n ? 1 : n)}>
          {n}×
        </button>
      ))}
      <button
        className={`repeat-btn ${isInfinite ? 'active' : ''}`}
        onClick={() => setRepeatCount(isInfinite ? 1 : Infinity)}
        title={isInfinite ? 'Stop continuous loop' : 'Loop continuously'}
      >
        {isInfinite ? '∞' : '∞'}
      </button>
      {showCustom ? (
        <form onSubmit={submit} className="custom-repeat-form">
          <input autoFocus type="number" min="1" max="99" value={customVal} onChange={(e) => setCustomVal(e.target.value)} className="custom-repeat-input" placeholder="#" />
          <button type="submit" className="repeat-btn active">✓</button>
          <button type="button" className="repeat-btn" onClick={() => { setShowCustom(false); setCustomVal('') }}>✕</button>
        </form>
      ) : (
        <button className={`repeat-btn ${isCustomActive ? 'active' : ''}`} onClick={() => setShowCustom(true)}>
          {isCustomActive ? `${repeatCount}×` : 'Custom'}
        </button>
      )}
    </div>
  )
}

// ── Repeat Range Panel ────────────────────────────────────────────────────────

function RepeatRangePanel({ verses }) {
  const { repeatRange, repeatRangeCount, setRepeatRangeCount, startRepeatRange, cancelRepeatRange, versesRef } = usePlayer()
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(Math.min(3, verses.length))
  const [count, setCount] = useState(2)
  const [open, setOpen] = useState(false)

  const start = () => {
    const f = Math.max(1, Math.min(from, verses.length)) - 1
    const t = Math.max(f + 1, Math.min(to, verses.length)) - 1
    setRepeatRangeCount(count)
    startRepeatRange(f, t, count, versesRef.current)
    setOpen(false)
  }

  if (repeatRange) {
    return (
      <div className="repeat-range-active">
        <span>🔁 Range {repeatRange.from + 1}–{repeatRange.to + 1} × {repeatRangeCount}</span>
        <button className="repeat-range-cancel" onClick={cancelRepeatRange}>✕ Cancel</button>
      </div>
    )
  }

  return (
    <div className="repeat-range-wrapper">
      <button className="repeat-range-btn" onClick={() => setOpen((v) => !v)}>🔁 Repeat Range</button>
      {open && (
        <div className="repeat-range-panel">
          <label>From verse <input type="number" min="1" max={verses.length} value={from} onChange={(e) => setFrom(+e.target.value)} /></label>
          <label>To verse <input type="number" min="1" max={verses.length} value={to} onChange={(e) => setTo(+e.target.value)} /></label>
          <label>Times <input type="number" min="2" max="99" value={count} onChange={(e) => setCount(+e.target.value)} /></label>
          <button className="repeat-range-start" onClick={start}>Start</button>
          <button className="repeat-range-cancel" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ── Notes editor ─────────────────────────────────────────────────────────────

function NoteEditor({ surahNo, ayahNo }) {
  const { getNote, setNote } = useStudy()
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const note = getNote(surahNo, ayahNo)

  const open_ = () => { setVal(getNote(surahNo, ayahNo)); setOpen(true) }
  const save = () => { setNote(surahNo, ayahNo, val.trim()); setOpen(false) }

  return (
    <>
      <button className={`verse-icon-btn ${note ? 'has-note' : ''}`} onClick={open_} title="Notes">
        {note ? '📝' : '🖊️'}
      </button>
      {open && (
        <div className="note-modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="note-modal">
            <div className="note-modal-header">
              <span>Note — Verse {ayahNo}</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <textarea
              className="note-textarea"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Write your note here…"
              autoFocus
              rows={5}
            />
            <div className="note-modal-footer">
              <button className="note-save-btn" onClick={save}>Save</button>
              <button className="note-cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Progress cycle button ─────────────────────────────────────────────────────

function ProgressBtn({ surahNo, ayahNo }) {
  const { getVerseProgress, setVerseProgress } = useStudy()
  const prog = getVerseProgress(surahNo, ayahNo)
  const next = PROGRESS_STATES[(PROGRESS_STATES.indexOf(prog) + 1) % PROGRESS_STATES.length]
  return (
    <button
      className="progress-btn"
      style={{ '--prog-color': PROGRESS_COLORS[prog] }}
      onClick={() => setVerseProgress(surahNo, ayahNo, next)}
      title={`Status: ${prog} — click to advance`}
    >
      {PROGRESS_LABELS[prog]}
    </button>
  )
}

// ── Main VerseList ────────────────────────────────────────────────────────────

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const VerseList = forwardRef(function VerseList(_, ref) {
  const { verses, selectedSurah, translations, transliterations } = useQuran()
  const { currentAudio, currentPlayingIndex, playingVerseIndex, playSingleVerse, stopSingleVerse, getAudioUrl } = usePlayer()
  const {
    hiddenArabic, toggleHideArabic,
    hiddenTranslation, toggleHideTranslation,
    isBookmarked, toggleBookmark,
    arabicFontSize, englishFontSize,
    enterFocus,
  } = useStudy()
  const { selectedTranslation, showTranslit } = useSettings()

  const [repeatCounts, setRepeatCounts] = useState({})
  const repeatProgressRef = useRef({})
  const repeatVerseRef = useRef(-1)
  const verseRefs = useRef({})
  const [tafsirIndex, setTafsirIndex] = useState(-1)
  const [searchQuery, setSearchQuery] = useState('')

  // expose jump/search to parent via ref
  useImperativeHandle(ref, () => ({
    jumpTo: (idxOrQuery, isSearch) => {
      if (isSearch) {
        setSearchQuery(idxOrQuery)
        const q = idxOrQuery.toLowerCase()
        const idx = verses.findIndex((v) =>
          v.arabic1?.toLowerCase().includes(q) || v.english?.toLowerCase().includes(q)
        )
        if (idx >= 0) setTimeout(() => verseRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      } else {
        setSearchQuery('')
        setTimeout(() => verseRefs.current[idxOrQuery]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      }
    }
  }))

  const getRepeat = (i) => repeatCounts[i] || 1
  const setRepeat = (i, val) => setRepeatCounts((prev) => ({ ...prev, [i]: val }))

  useEffect(() => {
    const idx = currentPlayingIndex >= 0 ? currentPlayingIndex : playingVerseIndex
    if (idx >= 0 && verseRefs.current[idx])
      verseRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentPlayingIndex, playingVerseIndex])

  const handleRepeatEnd = (index, verse) => {
    if (repeatVerseRef.current !== index) return
    const target = getRepeat(index)
    const current = repeatProgressRef.current[index] || 0

    if (target === Infinity) {
      repeatProgressRef.current[index] = current + 1
      playSingleVerse(index, verse, () => handleRepeatEnd(index, verse))
      return
    }

    const { nextProgress, shouldContinue } = getNextRepeatProgress(current, target)
    if (shouldContinue) {
      repeatProgressRef.current[index] = nextProgress
      playSingleVerse(index, verse, () => handleRepeatEnd(index, verse))
    } else {
      repeatProgressRef.current[index] = 0
      repeatVerseRef.current = -1
      stopSingleVerse()
    }
  }

  const handleVersePlay = (index, verse) => {
    if (playingVerseIndex === index) {
      repeatVerseRef.current = -1; repeatProgressRef.current[index] = 0; stopSingleVerse()
    } else {
      repeatProgressRef.current[index] = 1; repeatVerseRef.current = index
      playSingleVerse(index, verse, () => handleRepeatEnd(index, verse))
    }
  }

  const filteredVerses = searchQuery
    ? verses.filter((v) => {
        const q = searchQuery.toLowerCase()
        return v.arabic1?.toLowerCase().includes(q) || v.english?.toLowerCase().includes(q)
      })
    : verses

  return (
    <div className="verses">
      {searchQuery && (
        <div className="search-results-bar">
          <span>{filteredVerses.length} result{filteredVerses.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
          <button onClick={() => setSearchQuery('')}>✕ Clear</button>
        </div>
      )}
      <RepeatRangePanel verses={verses} />
      {filteredVerses.map((verse) => {
        const index = verses.indexOf(verse)
        const isChapterPlaying = currentPlayingIndex === index
        const isVersePlaying = playingVerseIndex === index
        const isPlaying = isChapterPlaying || isVersePlaying
        const repeatCount = getRepeat(index)
        const progress = repeatProgressRef.current[index] || 0
        const isInfiniteLoop = repeatCount === Infinity
        const showProgress = isVersePlaying && repeatCount > 1 && progress > 0 && !isInfiniteLoop
        const bookmarked = isBookmarked(selectedSurah.number, verse.ayahNo)

        return (
          <div
            key={verse.ayahNo}
            className={`verse ${isPlaying ? 'playing' : ''} ${bookmarked ? 'bookmarked' : ''}`}
            ref={(el) => { verseRefs.current[index] = el }}
          >
            {/* ── Verse header ── */}
            <div className="verse-header">
              <div className="verse-header-left">
                <span className="verse-number" onClick={() => enterFocus(index)} title="Open in focus mode" style={{ cursor: 'pointer' }}>
                  {verse.ayahNo}
                </span>
                <ProgressBtn surahNo={selectedSurah.number} ayahNo={verse.ayahNo} />
              </div>
              <div className="verse-controls">
                <RepeatControl repeatCount={repeatCount} setRepeatCount={(val) => setRepeat(index, val)} />
                <button onClick={() => handleVersePlay(index, verse)} className={`verse-play-button ${isVersePlaying ? 'active' : ''}`}>
                  {isVersePlaying ? '⏹ Stop' : '▶ Play'}
                </button>
                {isInfiniteLoop && isVersePlaying && <span className="repeat-badge">∞</span>}
                {showProgress && <span className="repeat-badge">{progress}/{repeatCount}</span>}
                <button
                  className={`verse-icon-btn ${bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark(selectedSurah.number, verse.ayahNo)}
                  title="Bookmark"
                >
                  {bookmarked ? '🔖' : '🏷️'}
                </button>
                <NoteEditor surahNo={selectedSurah.number} ayahNo={verse.ayahNo} />
                <button className="verse-icon-btn" onClick={() => setTafsirIndex(tafsirIndex === index ? -1 : index)} title="Tafsir">
                  📖
                </button>
                <button className="verse-icon-btn" onClick={() => enterFocus(index)} title="Focus mode">
                  ⛶
                </button>
              </div>
            </div>

            {/* ── Visibility toggles row ── */}
            <div className="visibility-row">
              <button className="visibility-btn" onClick={() => toggleHideArabic(index)}>
                {hiddenArabic[index] ? '👁 Show Arabic' : '🙈 Hide Arabic'}
              </button>
              <button className="visibility-btn" onClick={() => toggleHideTranslation(index)}>
                {hiddenTranslation[index] ? '👁 Show Translation' : '🙈 Hide Translation'}
              </button>
            </div>

            {/* ── Arabic text ── */}
            {hiddenArabic[index] ? (
              <div className="hidden-text-block" onClick={() => toggleHideArabic(index)}>
                Tap to reveal Arabic text
              </div>
            ) : (
              <ArabicText
                text={verse.arabic1}
                audio={currentAudio}
                isPlaying={isPlaying}
                audioUrl={getAudioUrl(verse)}
                fontSize={arabicFontSize}
              />
            )}

            {/* ── English / selected translation ── */}
            {hiddenTranslation[index] ? (
              <div className="hidden-text-block" onClick={() => toggleHideTranslation(index)}>
                Tap to reveal translation
              </div>
            ) : (
              <>
                <p className="english" style={{ fontSize: englishFontSize + 'px' }} lang="en">
                  {highlight(
                    translations[selectedTranslation]?.[index]?.text || verse.english,
                    searchQuery
                  )}
                </p>
                {showTranslit && transliterations[index] && (
                  <p className="transliteration" aria-label="Transliteration">
                    {transliterations[index].text}
                  </p>
                )}
              </>
            )}

            {/* ── Tafsir panel ── */}
            {tafsirIndex === index && (
              <TafsirPanel
                surahNo={selectedSurah.number}
                ayahNo={verse.ayahNo}
                onClose={() => setTafsirIndex(-1)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})

export default VerseList
