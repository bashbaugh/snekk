import preact from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { UIEventDispatcher } from '..'
import PlayModal from './PlayModal'

const Home: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
}> = ({ dispatchEvent }) => {

  return (
    <div class='flex flex-col gap-16 items-center'>
      <h1 class='text-7xl shadow-xl'>Snekk.io</h1>
      <PlayModal dispatchEvent={dispatchEvent} />
    </div>
  )
}

export default Home
