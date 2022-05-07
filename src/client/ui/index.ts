import { createElement, render } from 'preact'
import type { StateUpdater } from 'preact/hooks'
import { DeathReason } from 'types/game'
import UIApp from './UIApp'

export interface UIState {
  ui: 'inGame' | 'loading' | 'readyToPlay' | 'disconnected'
  stats?: {
    fps: number
    ping?: number
  }
  player?: {
    length: number
  }
  showStats: boolean
  loadingText: string
  wsDisconnectCode?: number
  deathReason?: DeathReason
}

export type UIEventType = 'startPlaying'
export interface UIEventData {
  startPlaying: {
    name: string
  }
}
export class UIEvent<T extends UIEventType> extends Event {
  constructor(type: T, public data: UIEventData[T]) {
    super(type as unknown as string)
  }
}
export type UIEventDispatcher = <T extends UIEventType>(
  type: T,
  data: UIEventData[T]
) => boolean
export type UIEventListener = <T extends UIEventType>(e: UIEvent<T>) => void

export default class UI {
  private _state: UIState
  private _setState?: StateUpdater<UIState>
  private eventTarget: EventTarget

  constructor() {
    this.eventTarget = new EventTarget()
    this._state = {
      ui: 'loading',
      showStats: true,
      loadingText: 'Loading...',
    }
  }

  /** Dispatch a UI event to this event target */
  dispatchEvent: UIEventDispatcher = (type, data) => {
    return this.eventTarget.dispatchEvent(new UIEvent(type, data))
  }

  /** Add an event listener to this event target */
  addEventListener<T extends UIEventType>(type: T, listener: UIEventListener) {
    this.eventTarget.addEventListener(type, listener as any)
  }

  removeEventListener<T extends UIEventType>(
    type: T,
    listener: UIEventListener
  ) {
    this.eventTarget.removeEventListener(type, listener as any)
  }

  get state(): Readonly<UIState> {
    return this._state
  }

  /** Merges passed state with state (shallow) and triggers Preact rerender */
  setState(state: Partial<UIState>) {
    const newState = { ...this._state, ...state }
    this._setState?.(newState)
    this._state = newState
  }

  renderUI() {
    const root: HTMLElement = document.createElement('div')
    root.id = 'ui-root'
    document.body.appendChild(root)
    const node = createElement(UIApp, {
      dispatchEvent: this.dispatchEvent,
      initialState: this.state,
      // Hook the UI component's setState function so that we can modify state outside of Preact
      setStateUpdater: f => {
        this._setState = f
      },
    })
    render(node, root)
  }
}
