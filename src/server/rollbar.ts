import CONFIG from 'config'
import Rollbar from 'rollbar'

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment:
    process.env.NODE_ENV === 'production' ? 'production' : 'development',
  autoInstrument: true,
  enabled: process.env.NODE_ENV === 'production',
  payload: {
    snekk_verion: CONFIG.version,
  },
})

export default rollbar
