import preact from 'preact'
import { StateUpdater, useState } from 'preact/hooks'
import { UIEventDispatcher, UIState } from '.'
import PreGameModal from './PreGameModal'
import StatsDisplay from './StatsDisplay'

const UIApp: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
  initialState: UIState
  setStateUpdater: (setState: StateUpdater<UIState>) => void
}> = ({ initialState, setStateUpdater, dispatchEvent }) => {
  const [state, setState] = useState<UIState>(initialState)

  setStateUpdater(setState)

  return (
    <div class="h-screen">
      <div class="absolute">
        {state.showStats && state.stats && <StatsDisplay {...state.stats} />}
      </div>
      {!state.inGame && (
        <>
          <div class="flex items-center justify-center h-full">
            {state.readyToPlay && (
              <PreGameModal dispatchEvent={dispatchEvent} />
            )}
            {!state.readyToPlay && (
              <div class="text-center font-bold text-3xl">
                {state.loadingText}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default UIApp
