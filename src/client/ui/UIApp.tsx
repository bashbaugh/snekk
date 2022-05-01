import { StateUpdater, useState } from 'preact/hooks'
import { UIState } from '.'
import StatsDisplay from './StatsDisplay'

const UIApp: preact.FunctionComponent<{
  initialState: UIState
  setStateUpdater: (setState: StateUpdater<UIState>) => void
}> = ({ initialState, setStateUpdater }) => {
  const [state, setState] = useState<UIState>(initialState)

  setStateUpdater(setState)

  return (
    <div>
      {state.showStats && state.stats && <StatsDisplay {...state.stats} />}
    </div>
  )
}

export default UIApp
