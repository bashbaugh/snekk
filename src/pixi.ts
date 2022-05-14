// https://pixijs.io/customize/

export * from '@pixi/constants'
export * from '@pixi/math'
export * from '@pixi/runner'
export * from '@pixi/settings'
export * from '@pixi/ticker'
import * as utils from '@pixi/utils'
export { utils }
export * from '@pixi/display'
export * from '@pixi/core'
export * from '@pixi/app'
export * from '@pixi/graphics'
export * from '@pixi/loaders'
import '@pixi/graphics-extras'
export * from '@pixi/sprite'
export * from '@pixi/sprite-tiling'
export * from '@pixi/text'
export * as sound from '@pixi/sound'
export * as particles from '@pixi/particle-emitter'

// Renderer plugins
import { Renderer } from '@pixi/core'
import { BatchRenderer } from '@pixi/core'
Renderer.registerPlugin('batch', BatchRenderer)
import { TilingSpriteRenderer } from '@pixi/sprite-tiling'
Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer)

// Application plugins
import { Application } from '@pixi/app'
import { TickerPlugin } from '@pixi/ticker'
Application.registerPlugin(TickerPlugin)

// Filters
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom'
import { TwistFilter } from '@pixi/filter-twist'
export const filters = {
  AdvancedBloomFilter,
  TwistFilter,
}

// TODO keep VERSION up to date
export const VERSION = '6.3.0'
