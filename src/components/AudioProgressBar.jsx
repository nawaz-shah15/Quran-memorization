import { useEffect, useMemo, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

function AudioProgressBar() {
  const { currentAudio, currentPlayingIndex, playingVerseIndex } = usePlayer()
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!currentAudio) {
      setProgress(0)
      setDuration(0)
      return
    }

    const update = () => {
      setProgress(currentAudio.currentTime || 0)
      setDuration(currentAudio.duration || 0)
    }

    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [currentAudio, currentPlayingIndex, playingVerseIndex])

  const percent = useMemo(() => {
    if (!duration) return 0
    return Math.min(100, Math.round((progress / duration) * 100))
  }, [progress, duration])

  if (!currentAudio) return null

  return (
    <div className="audio-progress-bar">
      <div className="audio-progress-track">
        <div className="audio-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span>{Math.floor(progress)}s / {Math.floor(duration)}s</span>
    </div>
  )
}

export default AudioProgressBar
