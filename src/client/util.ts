import CONFIG from 'config'

export const debugLog = (...args: any[]) => {
  if (CONFIG.debug) {
    console.log(...args)
  }
}
