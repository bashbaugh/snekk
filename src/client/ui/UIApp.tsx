import preact from 'preact'
import { StateUpdater, useState } from 'preact/hooks'
import { UIEventDispatcher, UIState } from '.'
import Home from './Home'
import PlayerStats from './components/PlayerStats'
import StatsDisplay from './components/StatsDisplay'
import Leaderboard from './components/Leaderboard'

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
      {state.ui == 'inGame' && (
        <>
          {state.player && <PlayerStats player={state.player} />}
          {state.players && <Leaderboard players={state.players} />}
        </>
      )}
      <div class="flex items-center justify-center h-full">
        {state.ui === 'loading' && (
          <div class="font-bold text-3xl">{state.loadingText}</div>
        )}
        {state.ui == 'readyToPlay' && (
          <Home death={state.deathReason} dispatchEvent={dispatchEvent} />
        )}
        {state.ui === 'disconnected' && (
          <div class="bg-black bg-opacity-60 p-10 rounded-lg flex flex-col gap-3 items-center">
            <h2 class="font-bold text-3xl text-red-500">Disconnected</h2>
            This could be due to a server restart or poor connection.
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
