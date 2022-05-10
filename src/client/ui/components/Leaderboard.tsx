import clsx from 'clsx'
import preact from 'preact'

const Leaderboard: preact.FunctionComponent<{
  players: Array<{
    id: string
    name: string
    score: number
    isSelf: boolean
  }>
}> = ({ players }) => {
  return (
    <div class="absolute right-0 top-0 w-48 m-3 p-2 rounded-md bg-white bg-opacity-80 text-black text-sm">
      <div class="flex flex-col gap-1">
        {players
          .sort((a, b) => b.score - a.score)
          .slice(0, 11)
          .map(({ id, name, score, isSelf }, i) => (
            <div key={id} class="flex flex-row gap-1">
              <div>{i + 1}.</div>
              <div
                class={clsx(
                  'flex-1 whitespace-nowrap overflow-clip',
                  isSelf && 'font-semibold'
                )}
              >
                {name}
              </div>
              <div class="font-bold">{score.toFixed()}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default Leaderboard
