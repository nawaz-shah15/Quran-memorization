import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SettingsContext = createContext(null)

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

// Translations available from alquran.cloud
export const TRANSLATIONS = [
  { id: 'en.sahih',      label: 'Sahih International' },
  { id: 'en.pickthall',  label: 'Pickthall' },
  { id: 'en.yusufali',   label: 'Yusuf Ali' },
  { id: 'en.asad',       label: 'Muhammad Asad' },
  { id: 'ur.jalandhry',  label: 'Urdu — Jalandhry' },
  { id: 'ur.ahmedali',   label: 'Urdu — Ahmed Ali' },
  { id: 'fr.hamidullah', label: 'French — Hamidullah' },
  { id: 'tr.diyanet',    label: 'Turkish — Diyanet' },
]

// Transliteration edition
export const TRANSLIT_EDITION = 'en.transliteration'

const DB_NAME = 'quran_cache'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('verses')) db.createObjectStore('verses')
      if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio')
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

export async function cacheGet(store, key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function cacheSet(store, key, value) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value, key)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch { return null }
}

export function SettingsProvider({ children }) {
  const [selectedTranslation, setSelectedTranslation] = useState(() => load('qm_translation', 'en.sahih'))
  const [showTranslit, setShowTranslit] = useState(() => load('qm_translit', false))
  const [recentSurahs, setRecentSurahs] = useState(() => load('qm_recent', []))
  const [downloadedAudio, setDownloadedAudio] = useState(() => load('qm_dl_audio', {}))

  useEffect(() => { save('qm_translation', selectedTranslation) }, [selectedTranslation])
  useEffect(() => { save('qm_translit', showTranslit) }, [showTranslit])
  useEffect(() => { save('qm_recent', recentSurahs) }, [recentSurahs])
  useEffect(() => { save('qm_dl_audio', downloadedAudio) }, [downloadedAudio])

  const addRecentSurah = useCallback((surah) => {
    setRecentSurahs((prev) => {
      const filtered = prev.filter((s) => s.number !== surah.number)
      return [surah, ...filtered].slice(0, 10)
    })
  }, [])

  const markAudioDownloaded = useCallback((surahNo) => {
    setDownloadedAudio((prev) => ({ ...prev, [surahNo]: true }))
  }, [])

  const isAudioDownloaded = useCallback((surahNo) => !!downloadedAudio[surahNo], [downloadedAudio])

  return (
    <SettingsContext.Provider value={{
      selectedTranslation, setSelectedTranslation,
      showTranslit, setShowTranslit,
      recentSurahs, addRecentSurah,
      downloadedAudio, markAudioDownloaded, isAudioDownloaded,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
