import { useEffect, useState } from 'react'

function OfflineStatus() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="offline-banner">Offline mode — cached content will be used when available.</div>
  )
}

export default OfflineStatus
