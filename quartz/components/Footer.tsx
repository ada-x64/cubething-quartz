import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = (props: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${props.displayClass ?? ""}`}>
        <div class="footer-links">
          <div>
            <div id="credits">
              {"Based on "}
              <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
            </div>
            <ul>
              {Object.entries(links).map(([text, link]) => (
                <li>
                  <a href={link}>{text}</a>
                </li>
              ))}
            </ul>
          </div>
          <span id="tinylytics">
            Like this page? Give me a kudos!
            <button class="tinylytics_kudos"></button>
          </span>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
