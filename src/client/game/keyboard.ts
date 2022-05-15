type TurnHandlerCallback = (direction: Direction) => void
type BoostHandlerCallback = (boosting: boolean) => void
type FreezeHandlerCallback = (frozen: boolean) => void

const directions = {
  ArrowUp: 1,
  ArrowRight: 2,
  ArrowDown: 3,
  ArrowLeft: 4,
}

export default class KeyboardManager {
  private turnCb?: TurnHandlerCallback
  private boostCb?: BoostHandlerCallback
  private freezeCb?: FreezeHandlerCallback
  private upListener: any
  private downListener: any

  private lastTurn: number = 0
  
  isFrozen = false
  boostState = false

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
      const d = directions[e.key as keyof typeof directions]
      if (this.lastTurn !== d) this.turnCb?.(d as any)
      this.lastTurn = d
    }

    if (e.key === ' ' && !this.boostState)
      this.boostCb?.((this.boostState = true))

    // Fullscreen handler
    if (e.key === 'f') {
      if (!document.fullscreenElement && document.body.requestFullscreen)
        document.body.requestFullscreen()
      else document.exitFullscreen()
    }

    // Freeze handler
    if (e.key === 's') {
      this.freezeCb?.((this.isFrozen = !this.isFrozen))
    }
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

  setFreezeListener(cb: FreezeHandlerCallback) {
    this.freezeCb = cb
  }
}
