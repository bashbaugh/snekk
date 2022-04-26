type TurnHandlerCallback = (direction: Direction) => void

const directions = {
  ArrowUp: 1,
  ArrowRight: 2,
  ArrowDown: 3,
  ArrowLeft: 4,
}

export default class KeyboardManager {
  turnHandler: any

  constructor() {}

  addTurnListener(cb: TurnHandlerCallback) {
    this.turnHandler = (e: KeyboardEvent) => {
      if (e.key in directions) {
        cb(directions[e.key as keyof typeof directions] as any)
      }
    }
    window.addEventListener('keydown', this.turnHandler)
  }

  clearListeners() {
    window.removeEventListener('keydown', this.turnHandler)
  }
}
