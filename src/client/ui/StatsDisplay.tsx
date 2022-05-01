import ServerPinger from 'client/networking/ping'
import preact from 'preact'

const StatsDisplay: preact.FunctionComponent<{
  fps: number
  ping?: number
}> = ({ fps, ping }) => {
  return (
    <div class="opacity-70 text-xs">
      FPS: {fps.toFixed(0)}{' '}
      {ping && (
        <>
          <br />
          Ping: {ping.toFixed(0)}
        </>
      )}
    </div>
  )
}

export default StatsDisplay
