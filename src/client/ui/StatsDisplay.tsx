import preact from 'preact'

const StatsDisplay: preact.FunctionComponent<{
  fps: number
}> = ({ fps }) => {
  return <div>FPS: {fps}</div>
}

export default StatsDisplay
