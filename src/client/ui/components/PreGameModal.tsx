import preact from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { UIEventDispatcher } from '..'

const PreGameModal: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
}> = ({ dispatchEvent }) => {
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current!.value = window.localStorage.getItem('playername') || ''
  }, [])

  return (
    <form class="flex gap-4 bg-bg p-4 rounded-xl">
      <input
        autofocus
        ref={nameRef}
        placeholder="Enter your name"
        class="w-full p-2 rounded-md outline-none bg-white bg-opacity-20"
      />
      <button
        type="submit"
        class="p-2 bg-red-600 rounded-md"
        onClick={e => {
          e.preventDefault()
          let name = nameRef.current!.value.trim()
          if (name) window.localStorage.setItem('playername', name)
          else name = 'unnamed'

          dispatchEvent('startPlaying', {
            name,
          })
        }}
      >
        Play
      </button>
    </form>
  )
}

export default PreGameModal
