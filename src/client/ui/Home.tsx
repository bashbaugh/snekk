import CONFIG from 'config'
import preact from 'preact'
import { TSkinName } from 'shared/skins'
import { DeathReason } from 'types/game'
import { UIEventDispatcher } from '.'
import PlayModal from './components/PlayModal'

const FooterLink: preact.FunctionComponent<{ href: string }> = ({
  href,
  children,
}) => {
  return (
    <a class="text-sm font-bold p-2 hover:underline" href={href}>
      {children}
    </a>
  )
}

const Home: preact.FunctionComponent<{
  dispatchEvent: UIEventDispatcher
  death?: DeathReason
  tSkin: TSkinName
}> = ({ dispatchEvent, death, tSkin }) => {
  return (
    <div>
      <div class="flex flex-col gap-16 items-center">
        <h1 class="text-7xl shadow-xl">{CONFIG.gameName}</h1>
        {death && <p>Oops! You died.</p>}
        <PlayModal
          dispatchEvent={dispatchEvent}
          tSkin={tSkin}
          onChangeSkin={() => {}}
        />
      </div>
      <div class="absolute left-0 w-full bottom-0 flex gap-2 p-2">
        <div class="flex-grow" />
        <FooterLink href="/changelog">Changelog</FooterLink>
        <FooterLink href="/privacy">Privacy</FooterLink>
        <FooterLink href={`mailto:${CONFIG.gameEmail}`}>Contact</FooterLink>
      </div>
    </div>
  )
}

export default Home
