import { QuartzTransformerPlugin } from "../types"

export const lilguyTansformer: QuartzTransformerPlugin = () => {
  return {
    name: "lilguy",
    textTransform: (ctx, src) => {
      return src.replaceAll(
        /!\[\[(lilguy-\w+)\.gif\]\]/gi,
        `<img src="/static/lilguy/$1.gif" class="lilguy light-only"/><img src="/static/lilguy/$1-dark.gif" class="lilguy dark-only"/>`,
      )
    },
  }
}
