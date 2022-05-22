import * as PIXI from 'pixi'
import { polygonPerimeter } from 'shared/geometry'
import { hslToHex } from 'shared/util'

export const getBoostEmitterConf = (
  hue: number,
  graphics: GraphicsMode
): PIXI.particles.EmitterConfigV3 => ({
  emit: false,
  lifetime: {
    min: 0.5,
    max: 1.5,
  },
  frequency: graphics === 'HIGH' ? 0.05 : 0.1,
  pos: {
    x: 0,
    y: 0,
  },
  maxParticles: 200,
  behaviors: [
    {
      type: 'textureSingle',
      config: {
        texture: PIXI.Texture.from('particle_square'),
      },
    },
    {
      type: 'color',
      config: {
        color: {
          list: [
            {
              value: hslToHex(hue, 0.9, 0.6, true),
              time: 0,
            },
            {
              value: hslToHex(hue, 0.9, 0.4, true),
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'alpha',
      config: {
        alpha: {
          list: [
            {
              value: 0.8,
              time: 0,
            },
            {
              value: 0.1,
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'rotationStatic',
      config: {
        min: 0,
        max: 360,
      },
    },
    {
      type: 'scale',
      config: {
        scale: {
          list: [
            {
              value: 0.1,
              time: 0,
            },
            {
              value: 0.01,
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'moveSpeed',
      config: {
        speed: {
          list: [
            {
              value: 100,
              time: 0,
            },
            {
              value: 50,
              time: 1,
            },
          ],
          isStepped: false,
        },
      },
    },
  ],
})

export const getTerritoryCutEmitterConf =
  (): PIXI.particles.EmitterConfigV3 => ({
    emit: false,
    lifetime: {
      min: 0.6,
      max: 0.6,
    },
    frequency: 0.001,
    pos: {
      x: 0,
      y: 0,
    },
    maxParticles: 1000,
    behaviors: [
      {
        type: 'textureSingle',
        config: {
          texture: PIXI.Texture.from('particle_circle'),
        },
      },
      {
        type: 'color',
        config: {
          color: {
            list: [
              {
                value: '#ffffff',
                time: 0,
              },
              {
                value: '#fffffe',
                time: 1,
              },
            ],
          },
        },
      },
      {
        type: 'alpha',
        config: {
          alpha: {
            list: [
              {
                value: 1,
                time: 0,
              },
              {
                value: 0,
                time: 1,
              },
            ],
          },
        },
      },
      {
        type: 'rotationStatic',
        config: {
          min: 0,
          max: 360,
        },
      },
      {
        type: 'scale',
        config: {
          scale: {
            list: [
              {
                value: 0.05,
                time: 0,
              },
              {
                value: 0.04,
                time: 1,
              },
            ],
          },
        },
      },
      {
        type: 'spawnShape',
        config: {
          type: 'torus',
          data: {
            radius: 6,
            x: 0,
            y: 0,
            innerRadius: 4,
            rotation: true,
          },
        },
      },
    ],
  })

export const getRegionEmitterConf = (
  spawnPolygon: XY[],
  hue: number
): PIXI.particles.EmitterConfigV3 => ({
  emit: false,
  particlesPerWave: 0.01 * polygonPerimeter(spawnPolygon),
  emitterLifetime: 0.1,
  lifetime: {
    min: 1,
    max: 1.5,
  },
  frequency: 0.02,
  pos: {
    x: 0,
    y: 0,
  },
  maxParticles: 200,
  behaviors: [
    {
      type: 'textureSingle',
      config: {
        texture: PIXI.Texture.from('particle_hexagon'),
      },
    },
    {
      type: 'color',
      config: {
        color: {
          list: [
            {
              value: hslToHex(hue, 0.8, 0.6, true),
              time: 0,
            },
            {
              value: hslToHex(hue, 0.4, 0.5, true),
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'alpha',
      config: {
        alpha: {
          list: [
            {
              value: 1,
              time: 0,
            },
            {
              value: 1,
              time: 0.8,
            },
            {
              value: 0,
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'rotationStatic',
      config: {
        min: 0,
        max: 360,
      },
    },
    {
      type: 'scale',
      config: {
        scale: {
          list: [
            {
              value: 1,
              time: 0,
            },
            {
              value: 0.9,
              time: 1,
            },
          ],
        },
      },
    },
    {
      type: 'moveSpeed',
      config: {
        speed: {
          list: [
            {
              value: 80,
              time: 0,
            },
            {
              value: 10,
              time: 0.5,
            },
            {
              value: 0,
              time: 1,
            },
          ],
          isStepped: false,
        },
      },
    },
    {
      type: 'spawnShape',
      config: {
        type: 'polygonalChain',
        data: [spawnPolygon],
      },
    },
  ],
})
