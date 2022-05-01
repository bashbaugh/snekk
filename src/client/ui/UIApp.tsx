import { StateUpdater, useState } from 'preact/hooks'
import { UIState } from '.'
import PreGameModal from './PreGameModal'
import StatsDisplay from './StatsDisplay'

const UIApp: preact.FunctionComponent<{
  initialState: UIState
  setStateUpdater: (setState: StateUpdater<UIState>) => void
}> = ({ initialState, setStateUpdater }) => {
  const [state, setState] = useState<UIState>(initialState)

  setStateUpdater(setState)

  return (
    <div class='h-screen'>
      <div class='absolute'>
      {state.showStats && state.stats && <StatsDisplay {...state.stats} />}
      </div>
      <div class='flex items-center justify-center h-full'>
        {state.readyToPlay && <PreGameModal />}
        {!state.readyToPlay && <div class='text-center font-bold text-3xl'>{state.loadingText}</div>}
      </div>
    </div>
  )
}

export default UIApp
