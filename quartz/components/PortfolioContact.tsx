/** @jsxImportSource hastscript */
import { svgs } from "../static/svgs"

export type Options = {
  linkedin?: string
  github?: string
  email?: string
  bsky?: string
  resume?: string
}
export const PortfolioContact = ({ opts }: { opts?: Options }) => {
  if (opts) {
    const values = Object.entries(opts)
      .filter(([_key, value]) => !!value)
      .map(([key, value]) => <a href={value}>{svgs[key]()}</a>)
    return <div className="contact">{values}</div>
  } else {
    return <></>
  }
}
