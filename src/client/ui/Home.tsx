import preact from 'preact'
import { DeathReason } from 'types/game'
import { UIEventDispatcher } from '.'
import PlayModal from './components/PlayModal'

const Home: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
  death?: DeathReason
}> = ({ dispatchEvent, death }) => {
  return (
    <div class="flex flex-col gap-16 items-center">
      <h1 class="text-7xl shadow-xl">Snekk.io</h1>
      {death && <p>Oops! You died.</p>}
      <PlayModal dispatchEvent={dispatchEvent} />
    </div>
  )
}

export default Home
