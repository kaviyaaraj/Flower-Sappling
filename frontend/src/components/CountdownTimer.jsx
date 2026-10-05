import { useEffect, useState } from 'react'

export default function CountdownTimer({ target = '2026-10-15T18:00:00' }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 34, seconds: 18 })

  useEffect(() => {
    const deadline = new Date(target).getTime()

    const update = () => {
      const difference = Math.max(0, deadline - Date.now())
      const totalSeconds = Math.floor(difference / 1000)
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      })
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [target])

  return (
    <div className="countdown" aria-label="Flash sale countdown">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="countdown-unit">
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{key === 'hours' ? 'HRS' : key === 'minutes' ? 'MIN' : 'SEC'}</span>
        </div>
      ))}
    </div>
  )
}
