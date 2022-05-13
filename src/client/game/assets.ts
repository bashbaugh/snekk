import * as PIXI from 'pixi'
import { territorySkins } from 'shared/skins'

const assets: Record<string, string> = {
  pattern_bg: 'assets/pattern/bg.png',

  particle_square: 'assets/particle/100px.png',
  particle_circle: 'assets/particle/100pxcircle.png',
  // particle_flame: 'assets/particle/flame.png',
  particle_hexagon: 'assets/particle/hexagon.png',

  sound_food: 'assets/sound/food.wav',
  sound_death: 'assets/sound/death.wav',
  sound_turn: 'assets/sound/turn.wav',

  hexagon: 'assets/hexagon_white.png',

  ...territorySkins,
}

export type AssetID = keyof typeof assets

const loader = PIXI.Loader.shared
export const resources = loader.resources

export function loadAssets() {
  return new Promise<void>(resolve => {
    for (const id in assets) {
      loader.add(id, assets[id as AssetID])
    }
    loader.load()
    loader.onComplete.add(() => {
      resolve()

      resources.sound_turn.sound!.volume = 0.4
    })
  })
}
