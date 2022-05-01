import preact from 'preact'

const PreGameModal: preact.FunctionComponent<{}> = ({}) => {
  return <div class="flex gap-4 bg-bg p-4 rounded-xl">
    <input placeholder='Enter your name' class="w-full p-2 rounded-md outline-none" />
    <button class="p-2 bg-red-600 rounded-md">Play</button>
  </div>
}

export default PreGameModal
