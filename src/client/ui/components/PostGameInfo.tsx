import CONFIG from 'config'
import preact from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { formatTime, selectRandom } from 'shared/util'
import { DeathReason } from 'types/game'
import { UIState } from '..'

const PostGameStat: preact.FunctionComponent<any> = ({ title, children }) => {
  return (
    <div class="flex flex-col gap-2 items-center">
      <h2 class="font-bold">{title}</h2>
      <div class="text-sm font-semibold">{children}</div>
    </div>
  )
}

const PostGameInfo: preact.FunctionComponent<{
  postGame: Exclude<UIState['postGame'], undefined>
  onContinue: () => void
}> = ({ onContinue, postGame: g }) => {
  const [msg] = useState(
    selectRandom([
      'Oops!',
      'Better luck next time.',
      'Oh no!',
      '🪦',
      'R.I.P.',
      '😔',
    ])
  )

  useEffect(() => {
    const l = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onContinue()
      }
    }
    window.addEventListener('keydown', l)
    return () => {
      window.removeEventListener('keydown', l)
    }
  }, [])

  return (
    <div class="animate-tilt-in">
      <div class="flex flex-col gap-16 items-center">
        <div class="flex flex-col items-center gap-5 p-4 bg-black bg-opacity-30 rounded-lg text-center">
          <h1 class="text-4xl">{msg}</h1>
          <p class="opacity-80 text-sm">
            {
              {
                [DeathReason.player_collision]: `You were killed by ${
                  g.killer || 'someone'
                }`,
                [DeathReason.self_collision]: 'You kinda ran into yourself.',
                [DeathReason.wall_collision]: 'Stay away from the walls!',
              }[g.deathReason]
            }
          </p>
          <div class="flex gap-8 items-center">
            <PostGameStat title="Score">{g.score}</PostGameStat>
            <PostGameStat title="Kills">{g.kills}</PostGameStat>
            <PostGameStat title="Time Alive">{formatTime(g.time)}</PostGameStat>
          </div>
          <div class="flex gap-2">
            <button
              autoFocus
              type="submit"
              class="text-white flex-grow p-2 bg-black font-semibold rounded-md outline-none"
              onClick={e => {
                e.preventDefault()
                onContinue()
              }}
            >
              Continue [Enter]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostGameInfo
