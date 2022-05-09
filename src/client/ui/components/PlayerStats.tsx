import CONFIG from 'config'
import preact from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { formatTime } from 'shared/util'

const PlayerStats: preact.FunctionComponent<{
  player: {
    length: number
    score: number
  }
}> = ({ player: p }) => {
  const [start] = useState(Date.now())
  const [time, setTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now() - start)
    }, 10) // TODO <- WHATT?? Maybe add to UI state instead
    return () => clearInterval(interval)
  })

  return (
    <div class="flex flex-col gap-2 p-4 absolute bottom-0 opacity-70">
      <div class="text-lg font-semibold">{p.score.toFixed()}</div>
      <div>Length: {(p.length * CONFIG.snake.lengthValMultiplier).toFixed()}</div>
      <div>{formatTime(time)}</div>
    </div>
  )
}

export default PlayerStats
