import preact from 'preact'

const Leaderboard: preact.FunctionComponent<{
  players: Array<{
    id: string
    name: string
    score: number
  }>
}> = ({ players }) => {
  return (
    <div class="absolute right-0 top-0 w-48 m-3 p-2 rounded-md bg-white bg-opacity-60 text-black text-sm">
      <div class="flex flex-col gap-2">
        {players
          .sort((a, b) => b.score - a.score)
          .slice(0, 11)
          .map(({ id, name, score }, i) => (
            <div key={id} class="flex flex-row gap-2">
              <div>{i + 1}.</div>
              <div class="flex-grow">{name}</div>
              <div class="font-bold">{score}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default Leaderboard
