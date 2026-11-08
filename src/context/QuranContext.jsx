import { createContext, useContext, useState, useEffect } from 'react'
import { cacheGet, cacheSet, TRANSLIT_EDITION } from './SettingsContext'

const SURAHS = [
  { number: 1, name: 'Al-Fatiha', englishName: 'The Opening' },
  { number: 2, name: 'Al-Baqarah', englishName: 'The Cow' },
  { number: 3, name: 'Aal-E-Imran', englishName: 'The Family of Imran' },
  { number: 4, name: 'An-Nisa', englishName: 'The Women' },
  { number: 5, name: 'Al-Ma\'idah', englishName: 'The Table Spread' },
  { number: 6, name: 'Al-An\'am', englishName: 'The Cattle' },
  { number: 7, name: 'Al-A\'raf', englishName: 'The Heights' },
  { number: 8, name: 'Al-Anfal', englishName: 'The Spoils of War' },
  { number: 9, name: 'At-Tawbah', englishName: 'The Repentance' },
  { number: 10, name: 'Yunus', englishName: 'Jonah' },
  { number: 11, name: 'Hud', englishName: 'Hud' },
  { number: 12, name: 'Yusuf', englishName: 'Joseph' },
  { number: 13, name: 'Ar-Ra\'d', englishName: 'The Thunder' },
  { number: 14, name: 'Ibrahim', englishName: 'Abraham' },
  { number: 15, name: 'Al-Hijr', englishName: 'The Rocky Tract' },
  { number: 16, name: 'An-Nahl', englishName: 'The Bee' },
  { number: 17, name: 'Al-Isra', englishName: 'The Night Journey' },
  { number: 18, name: 'Al-Kahf', englishName: 'The Cave' },
  { number: 19, name: 'Maryam', englishName: 'Mary' },
  { number: 20, name: 'Ta-Ha', englishName: 'Ta-Ha' },
  { number: 21, name: 'Al-Anbiya', englishName: 'The Prophets' },
  { number: 22, name: 'Al-Hajj', englishName: 'The Pilgrimage' },
  { number: 23, name: 'Al-Mu\'minun', englishName: 'The Believers' },
  { number: 24, name: 'An-Nur', englishName: 'The Light' },
  { number: 25, name: 'Al-Furqan', englishName: 'The Criterion' },
  { number: 26, name: 'Ash-Shu\'ara', englishName: 'The Poets' },
  { number: 27, name: 'An-Naml', englishName: 'The Ant' },
  { number: 28, name: 'Al-Qasas', englishName: 'The Stories' },
  { number: 29, name: 'Al-Ankabut', englishName: 'The Spider' },
  { number: 30, name: 'Ar-Rum', englishName: 'The Romans' },
  { number: 31, name: 'Luqman', englishName: 'Luqman' },
  { number: 32, name: 'As-Sajdah', englishName: 'The Prostration' },
  { number: 33, name: 'Al-Ahzab', englishName: 'The Combined Forces' },
  { number: 34, name: 'Saba', englishName: 'Sheba' },
  { number: 35, name: 'Fatir', englishName: 'The Originator' },
  { number: 36, name: 'Ya-Sin', englishName: 'Ya-Sin' },
  { number: 37, name: 'As-Saffat', englishName: 'Those Who Set The Ranks' },
  { number: 38, name: 'Sad', englishName: 'Sad' },
  { number: 39, name: 'Az-Zumar', englishName: 'The Troops' },
  { number: 40, name: 'Ghafir', englishName: 'The Forgiver' },
  { number: 41, name: 'Fussilat', englishName: 'Explained In Detail' },
  { number: 42, name: 'Ash-Shura', englishName: 'The Consultation' },
  { number: 43, name: 'Az-Zukhruf', englishName: 'The Ornaments of Gold' },
  { number: 44, name: 'Ad-Dukhan', englishName: 'The Smoke' },
  { number: 45, name: 'Al-Jathiyah', englishName: 'The Crouching' },
  { number: 46, name: 'Al-Ahqaf', englishName: 'The Wind-Curved Sandhills' },
  { number: 47, name: 'Muhammad', englishName: 'Muhammad' },
  { number: 48, name: 'Al-Fath', englishName: 'The Victory' },
  { number: 49, name: 'Al-Hujurat', englishName: 'The Rooms' },
  { number: 50, name: 'Qaf', englishName: 'Qaf' },
  { number: 51, name: 'Adh-Dhariyat', englishName: 'The Winnowing Winds' },
  { number: 52, name: 'At-Tur', englishName: 'The Mount' },
  { number: 53, name: 'An-Najm', englishName: 'The Star' },
  { number: 54, name: 'Al-Qamar', englishName: 'The Moon' },
  { number: 55, name: 'Ar-Rahman', englishName: 'The Beneficent' },
  { number: 56, name: 'Al-Waqi\'ah', englishName: 'The Inevitable' },
  { number: 57, name: 'Al-Hadid', englishName: 'The Iron' },
  { number: 58, name: 'Al-Mujadilah', englishName: 'The Pleading Woman' },
  { number: 59, name: 'Al-Hashr', englishName: 'The Exile' },
  { number: 60, name: 'Al-Mumtahanah', englishName: 'She That Is To Be Examined' },
  { number: 61, name: 'As-Saff', englishName: 'The Ranks' },
  { number: 62, name: 'Al-Jumu\'ah', englishName: 'The Congregation' },
  { number: 63, name: 'Al-Munafiqun', englishName: 'The Hypocrites' },
  { number: 64, name: 'At-Taghabun', englishName: 'The Mutual Disillusion' },
  { number: 65, name: 'At-Talaq', englishName: 'The Divorce' },
  { number: 66, name: 'At-Tahrim', englishName: 'The Prohibition' },
  { number: 67, name: 'Al-Mulk', englishName: 'The Sovereignty' },
  { number: 68, name: 'Al-Qalam', englishName: 'The Pen' },
  { number: 69, name: 'Al-Haqqah', englishName: 'The Reality' },
  { number: 70, name: 'Al-Ma\'arij', englishName: 'The Ascending Stairways' },
  { number: 71, name: 'Nuh', englishName: 'Noah' },
  { number: 72, name: 'Al-Jinn', englishName: 'The Jinn' },
  { number: 73, name: 'Al-Muzzammil', englishName: 'The Enshrouded One' },
  { number: 74, name: 'Al-Muddaththir', englishName: 'The Cloaked One' },
  { number: 75, name: 'Al-Qiyamah', englishName: 'The Resurrection' },
  { number: 76, name: 'Al-Insan', englishName: 'The Man' },
  { number: 77, name: 'Al-Mursalat', englishName: 'The Emissaries' },
  { number: 78, name: 'An-Naba', englishName: 'The Tidings' },
  { number: 79, name: 'An-Nazi\'at', englishName: 'Those Who Drag Forth' },
  { number: 80, name: 'Abasa', englishName: 'He Frowned' },
  { number: 81, name: 'At-Takwir', englishName: 'The Overthrowing' },
  { number: 82, name: 'Al-Infitar', englishName: 'The Cleaving' },
  { number: 83, name: 'Al-Mutaffifin', englishName: 'The Defrauding' },
  { number: 84, name: 'Al-Inshiqaq', englishName: 'The Sundering' },
  { number: 85, name: 'Al-Buruj', englishName: 'The Mansions of the Stars' },
  { number: 86, name: 'At-Tariq', englishName: 'The Nightcomer' },
  { number: 87, name: 'Al-A\'la', englishName: 'The Most High' },
  { number: 88, name: 'Al-Ghashiyah', englishName: 'The Overwhelming' },
  { number: 89, name: 'Al-Fajr', englishName: 'The Dawn' },
  { number: 90, name: 'Al-Balad', englishName: 'The City' },
  { number: 91, name: 'Ash-Shams', englishName: 'The Sun' },
  { number: 92, name: 'Al-Layl', englishName: 'The Night' },
  { number: 93, name: 'Ad-Duhaa', englishName: 'The Morning Hours' },
  { number: 94, name: 'Ash-Sharh', englishName: 'The Relief' },
  { number: 95, name: 'At-Tin', englishName: 'The Fig' },
  { number: 96, name: 'Al-Alaq', englishName: 'The Clot' },
  { number: 97, name: 'Al-Qadr', englishName: 'The Power' },
  { number: 98, name: 'Al-Bayyinah', englishName: 'The Clear Proof' },
  { number: 99, name: 'Az-Zalzalah', englishName: 'The Earthquake' },
  { number: 100, name: 'Al-Adiyat', englishName: 'The Courser' },
  { number: 101, name: 'Al-Qari\'ah', englishName: 'The Calamity' },
  { number: 102, name: 'At-Takathur', englishName: 'The Rivalry in World Increase' },
  { number: 103, name: 'Al-Asr', englishName: 'The Declining Day' },
  { number: 104, name: 'Al-Humazah', englishName: 'The Traducer' },
  { number: 105, name: 'Al-Fil', englishName: 'The Elephant' },
  { number: 106, name: 'Quraysh', englishName: 'Quraysh' },
  { number: 107, name: 'Al-Ma\'un', englishName: 'The Small Kindnesses' },
  { number: 108, name: 'Al-Kawthar', englishName: 'The Abundance' },
  { number: 109, name: 'Al-Kafirun', englishName: 'The Disbelievers' },
  { number: 110, name: 'An-Nasr', englishName: 'The Divine Support' },
  { number: 111, name: 'Al-Masad', englishName: 'The Palm Fiber' },
  { number: 112, name: 'Al-Ikhlas', englishName: 'The Sincerity' },
  { number: 113, name: 'Al-Falaq', englishName: 'The Daybreak' },
  { number: 114, name: 'An-Nas', englishName: 'Mankind' },
]

const QuranContext = createContext(null)

export function QuranProvider({ children }) {
  const [selectedSurah, setSelectedSurah] = useState(SURAHS[0])
  const [verses, setVerses] = useState([])
  const [translations, setTranslations] = useState({}) // { [edition]: [{ ayahNo, text }] }
  const [transliterations, setTransliterations] = useState([]) // [{ ayahNo, text }]
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredSurahs = SURAHS.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    return s.name.toLowerCase().includes(q) || s.englishName.toLowerCase().includes(q) || s.number.toString().includes(q)
  })

  const selectSurah = (surah) => {
    setSelectedSurah(surah)
    setSidebarOpen(false)
  }

  // Fetch a full surah from alquran.cloud with caching
  const fetchEdition = async (surahNo, edition) => {
    const cacheKey = `${surahNo}:${edition}`
    const cached = await cacheGet('verses', cacheKey)
    if (cached) return cached
    const data = await fetch(`https://api.alquran.cloud/v1/surah/${surahNo}/${edition}`)
      .then((r) => r.json())
    if (data.code === 200) {
      const result = data.data.ayahs.map((a) => ({ ayahNo: a.numberInSurah, text: a.text }))
      await cacheSet('verses', cacheKey, result)
      return result
    }
    return []
  }

  // Main verses fetch (quranapi — includes audio)
  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true)
      try {
        const cacheKey = `base:${selectedSurah.number}`
        const cached = await cacheGet('verses', cacheKey)
        let all
        if (cached) {
          all = cached
        } else {
          const first = await fetch(`https://quranapi.pages.dev/api/${selectedSurah.number}/1.json`).then((r) => r.json())
          all = await Promise.all(
            Array.from({ length: first.totalAyah }, (_, i) =>
              fetch(`https://quranapi.pages.dev/api/${selectedSurah.number}/${i + 1}.json`).then((r) => r.json())
            )
          )
          await cacheSet('verses', cacheKey, all)
        }
        setVerses(all)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    fetchSurah()
  }, [selectedSurah])

  // Fetch a translation edition on demand
  const loadTranslation = async (edition) => {
    if (translations[edition]) return
    try {
      const result = await fetchEdition(selectedSurah.number, edition)
      setTranslations((prev) => ({ ...prev, [edition]: result }))
    } catch (e) { console.error(e) }
  }

  // Fetch transliteration on demand
  const loadTransliteration = async () => {
    if (transliterations.length) return
    try {
      const result = await fetchEdition(selectedSurah.number, TRANSLIT_EDITION)
      setTransliterations(result)
    } catch (e) { console.error(e) }
  }

  // Reset translations/translit when surah changes
  useEffect(() => {
    setTranslations({})
    setTransliterations([])
  }, [selectedSurah])

  return (
    <QuranContext.Provider value={{
      SURAHS, selectedSurah, selectSurah, verses, loading,
      searchQuery, setSearchQuery, sidebarOpen, setSidebarOpen, filteredSurahs,
      translations, loadTranslation,
      transliterations, loadTransliteration,
    }}>
      {children}
    </QuranContext.Provider>
  )
}

export const useQuran = () => useContext(QuranContext)
