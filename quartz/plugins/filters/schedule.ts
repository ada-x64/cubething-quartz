import { QuartzFilterPlugin } from "../types"

export const FilterByDatePublished: QuartzFilterPlugin<{}> = () => ({
  name: "FilterByDatePublished",
  shouldPublish(_ctx, [_tree, vfile]) {
    return new Date(vfile.data.frontmatter?.published ?? 0) <= new Date()
  },
})
