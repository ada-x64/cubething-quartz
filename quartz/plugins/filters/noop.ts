import { QuartzFilterPlugin } from "../types"

export const NoopFilter: QuartzFilterPlugin<{}> = () => ({
  name: "NoopFilter",
  shouldPublish(_ctx, [_tree, _vfile]) {
    return true
  },
})
