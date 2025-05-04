import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import styles from "./styles/mobileNav.scss"
//@ts-ignore
import script from "./scripts/mobileNav.inline"
//@ts-ignore
import explorerScript from "./scripts/explorer.inline"
import ExplorerFactory from "./Explorer"
import TableOfContentsFactory from "./TableOfContents"
import BacklinksFactory from "./Backlinks"
import { pathToRoot } from "../util/path"
import DarkmodeFactory from "./Darkmode"
//@ts-ignore
import darkmodeScript from "./scripts/darkmode.inline"

interface Options {
  todo: boolean
}
export const defaultOpts: Options = {
  todo: true,
}

export default ((userOpts?: Options) => {
  const opts = { ...userOpts, ...defaultOpts }
  const Explorer = ExplorerFactory({})
  const TableOfContents = TableOfContentsFactory()
  const Backlinks = BacklinksFactory({ hideWhenEmpty: true })
  const Darkmode = DarkmodeFactory()

  function MobileNav(props: QuartzComponentProps) {
    const baseDir = pathToRoot(props.fileData.slug!)
    const title = (
      <h2 class="page-title move-mobile-nav">
        <a href={baseDir}>{props.cfg.pageTitle} </a>
        <div class="nav-menu">
          <Darkmode {...props} />
          <img src="/static/cube-light.gif" class="cube light-only close-mobile-nav" />
          <img src="/static/cube-dark.gif" class="cube dark-only close-mobile-nav" />
        </div>
      </h2>
    )
    const navi = (
      <>
        <hr />
        <h3 class="move-mobile-nav">Pages</h3>
        <Explorer {...props}></Explorer>
      </>
    )
    const toc = props.fileData.toc ? (
      <>
        <hr />
        <h3>Table of Contents</h3>
        <TableOfContents {...props}></TableOfContents>
      </>
    ) : null

    const backlinks = (
      <>
        <hr />
        <Backlinks {...props}></Backlinks>
      </>
    )
    return (
      <>
        <div id="mobile-nav-btn" class={props.displayClass}>
          <img
            class="cube dark-only"
            title="Open the mobile navigation menu."
            src="/static/cube-mobile-dark.gif"
          />
          <img
            class="cube light-only"
            title="Open the mobile navigation menu."
            src="/static/cube-mobile-light.gif"
          />
        </div>
        <div
          id="mobile-nav-wrapper"
          class={`closed close-mobile-nav ${props.displayClass}`}
          tabindex={-1}
        >
          <div id="mobile-nav-inner" class="inner move-mobile-nav">
            {title}
            {navi}
            {toc}
            {backlinks}
          </div>
        </div>
      </>
    )
  }

  MobileNav.css = styles
  // MobileNav.beforeDOMLoaded = darkmodeScript
  MobileNav.afterDOMLoaded = script //concatenateResources(script, explorerScript, )

  return MobileNav
}) satisfies QuartzComponentConstructor
