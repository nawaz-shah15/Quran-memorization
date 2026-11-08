import { createContext, useContext, useState, useEffect } from 'react'

const StudyContext = createContext(null)

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

// progress: 'not-started' | 'learning' | 'memorized'
export const PROGRESS_STATES = ['not-started', 'learning', 'memorized']
export const PROGRESS_LABELS = { 'not-started': '○ Not Started', 'learning': '◑ Learning', 'memorized': '● Memorized' }
export const PROGRESS_COLORS = { 'not-started': '#aaa', 'learning': '#e8a020', 'memorized': '#2e8b57' }

export function StudyProvider({ children }) {
  const [progress, setProgress] = useState(() => load('qm_progress', {}))
  const [bookmarks, setBookmarks] = useState(() => load('qm_bookmarks', {}))
  const [notes, setNotes] = useState(() => load('qm_notes', {}))
  const [hiddenArabic, setHiddenArabic] = useState({})
  const [hiddenTranslation, setHiddenTranslation] = useState({})
  const [arabicFontSize, setArabicFontSize] = useState(() => load('qm_arabic_fs', 28))
  const [englishFontSize, setEnglishFontSize] = useState(() => load('qm_english_fs', 15))
  const [theme, setTheme] = useState(() => load('qm_theme', 'light'))
  const [focusMode, setFocusMode] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)

  useEffect(() => { save('qm_progress', progress) }, [progress])
  useEffect(() => { save('qm_bookmarks', bookmarks) }, [bookmarks])
  useEffect(() => { save('qm_notes', notes) }, [notes])
  useEffect(() => { save('qm_arabic_fs', arabicFontSize) }, [arabicFontSize])
  useEffect(() => { save('qm_english_fs', englishFontSize) }, [englishFontSize])
  useEffect(() => { save('qm_theme', theme) }, [theme])

  const key = (surahNo, ayahNo) => `${surahNo}:${ayahNo}`

  const setVerseProgress = (surahNo, ayahNo, state) =>
    setProgress((p) => ({ ...p, [key(surahNo, ayahNo)]: state }))

  const getVerseProgress = (surahNo, ayahNo) => progress[key(surahNo, ayahNo)] || 'not-started'

  const toggleBookmark = (surahNo, ayahNo) =>
    setBookmarks((b) => { const k = key(surahNo, ayahNo); const n = { ...b }; n[k] ? delete n[k] : (n[k] = true); return n })

  const isBookmarked = (surahNo, ayahNo) => !!bookmarks[key(surahNo, ayahNo)]

  const setNote = (surahNo, ayahNo, text) =>
    setNotes((n) => { const k = key(surahNo, ayahNo); const next = { ...n }; text ? (next[k] = text) : delete next[k]; return next })

  const getNote = (surahNo, ayahNo) => notes[key(surahNo, ayahNo)] || ''

  const toggleHideArabic = (idx) => setHiddenArabic((h) => ({ ...h, [idx]: !h[idx] }))
  const toggleHideTranslation = (idx) => setHiddenTranslation((h) => ({ ...h, [idx]: !h[idx] }))

  const enterFocus = (idx) => { setFocusIndex(idx); setFocusMode(true) }
  const exitFocus = () => setFocusMode(false)

  return (
    <StudyContext.Provider value={{
      progress, getVerseProgress, setVerseProgress,
      bookmarks, toggleBookmark, isBookmarked,
      notes, setNote, getNote,
      hiddenArabic, toggleHideArabic,
      hiddenTranslation, toggleHideTranslation,
      arabicFontSize, setArabicFontSize,
      englishFontSize, setEnglishFontSize,
      theme, setTheme,
      focusMode, focusIndex, setFocusIndex, enterFocus, exitFocus,
    }}>
      {children}
    </StudyContext.Provider>
  )
}

export const useStudy = () => useContext(StudyContext)
