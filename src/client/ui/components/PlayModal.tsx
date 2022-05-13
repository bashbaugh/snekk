import CONFIG from 'config'
import preact from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { defaultTerritorySkin, territorySkins, TSkinName } from 'shared/skins'
import { UIEventDispatcher } from '..'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'

const skins = Object.keys(territorySkins)

const PlayModal: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
  tSkin: TSkinName
  onChangeSkin: (skin: TSkinName) => void
}> = ({ dispatchEvent, tSkin }) => {
  const nameRef = useRef<HTMLInputElement>(null)

  const [skinMenuOpen, setSkinMenuOpen] = useState(false)
  const [selectedSkin, setSelectedSkin] = useState(skins.indexOf(tSkin))

  useEffect(() => {
    nameRef.current!.value = window.localStorage.getItem('playername') || ''
    setSelectedSkin(
      skins.indexOf(
        window.localStorage.getItem('tskin') || defaultTerritorySkin
      )
    )
  }, [])

  return (
    <form class="flex flex-col bg-blue-800 p-3 gap-3 rounded-xl">
      <input
        autofocus
        ref={nameRef}
        placeholder="Enter a nickname"
        maxLength={CONFIG.snake.maxNameLength}
        class="w-60 p-2 rounded-md outline-none bg-white bg-opacity-20"
      />
      <div class="flex gap-2">
        <button
          type="submit"
          class="flex-grow p-2 bg-black font-semibold rounded-md"
          onClick={e => {
            e.preventDefault()
            let name = nameRef.current!.value.trim()
            window.localStorage.setItem('playername', name)
            window.localStorage.setItem('tskin', skins[selectedSkin])

            dispatchEvent('startPlaying', {
              name,
              territorySkin: skins[selectedSkin] as TSkinName,
            })
          }}
        >
          Play
        </button>
        <button
          title="Change Skin"
          type="button"
          class="p-2 bg-territory rounded-md"
          onClick={() => setSkinMenuOpen(o => !o)}
        >
          <img
            src={territorySkins[skins[selectedSkin] as TSkinName]}
            alt={tSkin}
            class="w-7 h-7"
          />
          {/* <img class='brightness-0' src={territorySkins[tSkin]} alt={tSkin} /> */}
        </button>
      </div>

      {skinMenuOpen && (
        <div class="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedSkin(
                selectedSkin === 0 ? skins.length - 1 : selectedSkin - 1
              )
            }}
          >
            <FiArrowLeft />
          </button>
          <div class="bg-territory grid flex-grow rounded-md">
            <div
              style={{
                opacity: 0.4,
                backgroundImage: `url(${
                  territorySkins[skins[selectedSkin] as TSkinName]
                })`,
              }}
              class="w-full h-28"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedSkin(
                selectedSkin === skins.length - 1 ? 0 : selectedSkin + 1
              )
            }}
          >
            <FiArrowRight />
          </button>
        </div>
      )}
    </form>
  )
}

export default PlayModal
