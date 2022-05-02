import preact from 'preact'
import { StateUpdater, useState } from 'preact/hooks'
import { UIEventDispatcher, UIState } from '.'
import PreGameModal from './components/PreGameModal'
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
      <div class="flex items-center justify-center h-full">
        {state.ui === 'loading' && (
          <div class="font-bold text-3xl">{state.loadingText}</div>
        )}
        {state.ui == 'readyToPlay' && (
          <PreGameModal dispatchEvent={dispatchEvent} />
        )}
        {state.ui === 'disconnected' && (
          <div class="bg-black bg-opacity-50 p-10 rounded-lg flex flex-col gap-3 items-center">
            <h2 class="font-bold text-3xl text-red-500">Disconnected</h2>
            {state.wsDisconnectCode && (
              <p>Error code: {state.wsDisconnectCode}</p>
            )}
            <button
              class="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UIApp
