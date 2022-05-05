import preact from 'preact'

const PlayerStats: preact.FunctionComponent<{
  player: {
    length: number
  }
}> = ({ player: p }) => {
  return (
    <div class="flex flex-col gap-2 p-4 absolute bottom-0 opacity-70">
      <div>Length: {p.length.toFixed()}</div>
    </div>
  )
}

export default PlayerStats
