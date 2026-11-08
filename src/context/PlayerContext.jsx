import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

const PlayerContext = createContext(null)

export const RECITERS = [
  { id: '1', name: 'Al-Afasy', label: 'Mishary Al-Afasy' },
  { id: '2', name: 'Husary', label: 'Mahmoud Khalil Al-Husary' },
  { id: '3', name: 'Abdul Basit', label: 'Abdul Basit Abdul Samad' },
  { id: '4', name: 'Al-Minshawi', label: 'Mohamed Siddiq Al-Minshawi' },
  { id: '5', name: 'Al-Ghamdi', label: 'Saad Al-Ghamdi' },
]

export const SPEEDS = [0.5, 0.75, 1, 1.25]

export function PlayerProvider({ children }) {
  const [selectedReciter, setSelectedReciter] = useState('1')
  const [currentAudio, setCurrentAudio] = useState(null)
  const [playingAll, setPlayingAll] = useState(false)
  const [pausedAll, setPausedAll] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1)
  const [playingVerseIndex, setPlayingVerseIndex] = useState(-1)
  const [speed, setSpeed] = useState(1)
  // sleep timer: minutes remaining, null = off
  const [sleepMinutes, setSleepMinutes] = useState(null)
  const sleepTimerRef = useRef(null)
  // repeat range: { from, to } (0-based indices), null = off
  const [repeatRange, setRepeatRange] = useState(null)
  const [repeatRangeCount, setRepeatRangeCount] = useState(2)
  const repeatRangeProgressRef = useRef(0)

  const versesRef = useRef([])

  const getAudioUrl = useCallback((verse) => verse.audio[selectedReciter]?.url || verse.audio['1'].url, [selectedReciter])

  // Apply speed to current audio whenever it changes
  useEffect(() => {
    if (currentAudio) currentAudio.playbackRate = speed
  }, [speed, currentAudio])

  // Sleep timer countdown
  useEffect(() => {
    clearInterval(sleepTimerRef.current)
    if (sleepMinutes === null || sleepMinutes <= 0) return
    sleepTimerRef.current = setInterval(() => {
      setSleepMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(sleepTimerRef.current)
          stopAll()
          return null
        }
        return prev - 1
      })
    }, 60000)
    return () => clearInterval(sleepTimerRef.current)
  }, [sleepMinutes])

  const stopAll = useCallback(() => {
    setCurrentAudio((audio) => { if (audio) audio.pause(); return null })
    setPlayingAll(false)
    setPausedAll(false)
    setCurrentPlayingIndex(-1)
    setPlayingVerseIndex(-1)
    repeatRangeProgressRef.current = 0
  }, [])

  const stopCurrentPlayback = useCallback(() => {
    stopAll()
  }, [stopAll])

  const selectReciter = (id) => { stopAll(); setSelectedReciter(id) }

  const playNext = useCallback((index, verses) => {
    const list = verses || versesRef.current
    if (!list.length) return

    // Repeat range logic
    if (repeatRange) {
      const { from, to } = repeatRange
      if (index > to) {
        repeatRangeProgressRef.current += 1
        if (repeatRangeProgressRef.current < repeatRangeCount) {
          // restart range
          playNext(from, list)
          return
        } else {
          repeatRangeProgressRef.current = 0
          setRepeatRange(null)
          stopAll()
          return
        }
      }
    }

    if (index >= list.length) {
      setPlayingAll(false)
      setCurrentPlayingIndex(-1)
      setPlayingVerseIndex(-1)
      return
    }

    const url = list[index].audio[selectedReciter]?.url || list[index].audio['1'].url
    const audio = new Audio(url)
    audio.playbackRate = speed
    audio.play()
    setCurrentAudio(audio)
    setCurrentPlayingIndex(index)
    setPlayingVerseIndex(-1)
    audio.onended = () => playNext(index + 1, list)
  }, [selectedReciter, speed, repeatRange, repeatRangeCount, stopAll])

  const playAll = useCallback((verses, startIndex = 0) => {
    const list = verses || versesRef.current
    if (pausedAll && currentAudio) {
      currentAudio.play()
      setPlayingAll(true)
      setPausedAll(false)
      return
    }
    stopCurrentPlayback()
    setPlayingAll(true)
    setPausedAll(false)
    repeatRangeProgressRef.current = 0
    playNext(startIndex, list)
  }, [pausedAll, currentAudio, playNext, stopCurrentPlayback])

  const pauseAll = useCallback(() => {
    if (currentAudio) currentAudio.pause()
    setPlayingAll(false)
    setPausedAll(true)
  }, [currentAudio])

  const playSingleVerse = useCallback((index, verse, onDone) => {
    stopCurrentPlayback()
    const url = getAudioUrl(verse)
    const audio = new Audio(url)
    audio.playbackRate = speed
    audio.play()
    setCurrentAudio(audio)
    setPlayingVerseIndex(index)
    setCurrentPlayingIndex(-1)
    setPlayingAll(false)
    setPausedAll(false)
    audio.onended = onDone
    return audio
  }, [getAudioUrl, speed, stopCurrentPlayback])

  const stopSingleVerse = useCallback(() => {
    setCurrentAudio((audio) => { if (audio) audio.pause(); return null })
    setPlayingVerseIndex(-1)
  }, [])

  const startRepeatRange = useCallback((from, to, count, verses) => {
    const list = verses || versesRef.current
    setRepeatRange({ from, to })
    setRepeatRangeCount(count)
    repeatRangeProgressRef.current = 0
    if (currentAudio) currentAudio.pause()
    setPlayingAll(true)
    setPausedAll(false)
    playNext(from, list)
  }, [currentAudio, playNext])

  const cancelRepeatRange = useCallback(() => {
    setRepeatRange(null)
    repeatRangeProgressRef.current = 0
    stopAll()
  }, [stopAll])

  return (
    <PlayerContext.Provider value={{
      selectedReciter, selectReciter,
      currentAudio, setCurrentAudio,
      playingAll, pausedAll,
      currentPlayingIndex, setCurrentPlayingIndex,
      playingVerseIndex, setPlayingVerseIndex,
      speed, setSpeed,
      sleepMinutes, setSleepMinutes,
      repeatRange, repeatRangeCount, setRepeatRangeCount,
      versesRef,
      getAudioUrl,
      playAll, pauseAll, stopAll,
      playNext,
      playSingleVerse, stopSingleVerse,
      startRepeatRange, cancelRepeatRange,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
