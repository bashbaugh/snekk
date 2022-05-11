import * as PIXI from 'pixi'

const assets = {
  pattern_dots: 'assets/pattern/dots.png',
  pattern_squares: 'assets/pattern/squares.png',
  pattern_bg: 'assets/pattern/bg.png',

  sound_food: 'assets/sound/food.wav',
  sound_death: 'assets/sound/death.wav',
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
    loader.onComplete.add(() => resolve())
  })
}
