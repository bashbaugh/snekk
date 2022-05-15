import CONFIG from 'config'
import './css/styles.css'
import App from './game/app'
;(() => {
  new App()
})()

console.log(
  `%c${CONFIG.gameName} v${CONFIG.version} :: Hello 👋`,
  'background:black;color:dodgerblue;font-size:18px;font-weight:bold;padding:5px;border-radius:5px;'
)
console.log(
  `Plz don't hack 🥺 it ruins the game for other players.\nInterested in contributing? Send an email to ${CONFIG.gameEmail}`
)
