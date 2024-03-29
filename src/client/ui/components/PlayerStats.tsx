import CONFIG from 'config'
import preact from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { formatTime } from 'shared/util'
import { UIState } from '..'

const PlayerStats: preact.FunctionComponent<{
  player: Exclude<UIState['player'], undefined>
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
    <div class="flex flex-col gap-1 p-4 absolute bottom-0 opacity-70">
      <div class="text-lg font-semibold">{p.score.toFixed()}</div>
      <div>
        Length: {(p.length * CONFIG.snake.lengthValMultiplier).toFixed()}
      </div>
      <div>Kills: {p.kills}</div>
      <div>{formatTime(time)}</div>
    </div>
  )
}

export default PlayerStats
