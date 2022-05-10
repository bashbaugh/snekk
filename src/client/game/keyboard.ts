type TurnHandlerCallback = (direction: Direction) => void
type BoostHandlerCallback = (boosting: boolean) => void

const directions = {
  ArrowUp: 1,
  ArrowRight: 2,
  ArrowDown: 3,
  ArrowLeft: 4,
}

export default class KeyboardManager {
  private turnCb?: TurnHandlerCallback
  private boostCb?: BoostHandlerCallback
  private upListener: any
  private downListener: any

  boostState: boolean = false

  constructor() {
    this.upListener = this.onKeydown.bind(this)
    this.downListener = this.onKeyup.bind(this)
    window.addEventListener('keydown', this.upListener)
    window.addEventListener('keyup', this.downListener)
  }

  clearListeners() {
    window.removeEventListener('keydown', this.upListener)
    window.removeEventListener('keyup', this.downListener)
  }

  private onKeydown(e: KeyboardEvent) {
    if (e.key in directions) {
      this.turnCb?.(directions[e.key as keyof typeof directions] as any)
    }

    if (e.key === ' ' && !this.boostState)
      this.boostCb?.((this.boostState = true))
  }

  private onKeyup(e: KeyboardEvent) {
    if (e.key === ' ') this.boostCb?.((this.boostState = false))
  }

  setTurnListener(cb: TurnHandlerCallback) {
    this.turnCb = cb
  }

  setBoostListener(cb: BoostHandlerCallback) {
    this.boostCb = cb
  }
}
