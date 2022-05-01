import { createElement, render } from 'preact'
import type { StateUpdater } from 'preact/hooks'
import UIApp from './UIApp'

export interface UIState {
  stats?: {
    fps: number
    ping?: number
  }
  showStats: boolean
}

export default class UI {
  private _state: UIState
  private _setState?: StateUpdater<UIState>

  constructor() {
    this._state = {
      showStats: true,
    }
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

  setStats(stats: UIState['stats']) {
    this.setState({ stats })
  }

  renderUI() {
    const root: HTMLElement = document.createElement('div')
    root.id = 'ui-root'
    document.body.appendChild(root)
    const node = createElement(UIApp, {
      initialState: this.state,
      // Hook the UI component's setState function so that we can modify state outside of Preact
      setStateUpdater: f => {
        this._setState = f
      },
    })
    render(node, root)
  }
}
