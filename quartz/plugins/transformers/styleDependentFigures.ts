import { QuartzTransformerPlugin } from "../types"

export const StyleDependentFigures: QuartzTransformerPlugin = () => {
  return {
    name: "dark-mode-images",
    textTransform: (ctx, src) => {
      const darkExists = (imgName: string) =>
        ctx.allFiles.find((fp) => new RegExp(`${imgName}-dark${extExp}$`, "gi").test(fp))
      const extList = ["gif", "jpg", "jpeg", "png", "webp", "svg"]
      const extExp = `(\\.(?:${extList.join("|")}))`
      const basepathExp = `((?:\\w|-|_)+)`
      const linkExp = "(::linked)?"
      const captionExp = "((?:\\s|\\n)*_[^_]+_)?"
      const titleExp = "(|[^\\]]+)?"

      const exp = new RegExp(
        `!\\[\\[${basepathExp}${extExp}${titleExp}\\]\\]${linkExp}${captionExp}`,
        "gi",
      )

      const basepathExpIdx = 1
      const extExpIdx = 2
      const titleExpIdx = 3
      const linkExpIdx = 4
      const captionExpIdx = 5

      src.matchAll(exp).forEach((match) => {
        const basepath = match[basepathExpIdx]
        const ext = match[extExpIdx]
        const lightPath = `${basepath}${ext}`
        const darkPath = `${basepath}-dark${ext}`

        const linked = !!match[linkExpIdx!]
        let link = (input: string, dark: boolean) => {
          return linked
            ? `<a href="${dark ? darkPath : lightPath}" data-no-popover="true">${input}</a>`
            : input
        }

        const captionContent = match[captionExpIdx!]
        const captioned = !!captionContent
        let caption = (input: string) => {
          return captioned
            ? `<figure>
                ${input}
                <figcaption>
                  ${captionContent.trim().slice(1, -1)}
                </figcaption>
                </figure>`
            : input
        }

        const title = match[titleExpIdx]
        const img = (path: string) => {
          const titleStr = !!title
            ? `title="${title.slice(1).trim()} Click for full image."`
            : linked
              ? `title="Click for full image."`
              : ``
          return `<img src="${path}" ${titleStr} />`
        }

        const gen = (dark: boolean | null) => {
          const path = dark ? darkPath : lightPath
          const cls = [
            "style-dependent-image-wrapper",
            path.includes("lilguy") ? "lilguy" : "",
            dark === null ? "" : dark ? "dark-only" : "light-only",
            linked ? "linked" : "",
            captioned ? "captioned" : "",
          ]
          return `<div class="${cls.join(" ")}">` + link(caption(img(path)), !!dark) + "</div>"
        }

        const final = darkExists(basepath) ? gen(true) + gen(false) : gen(null)
        src = src.replace(match[0], final)
      })

      return src
    },
  }
}
