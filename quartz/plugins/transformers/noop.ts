import chalk from "chalk"
import { QuartzTransformerPlugin } from "../types"

export interface Options {
  warn?: string
}

export const defaultOptions: Options = {}

export const noopTransformer: QuartzTransformerPlugin<Partial<Options>> = (opts?: Options) => {
  if (opts?.warn) {
    console.warn(chalk.yellow("Warning:", opts.warn))
  }
  return {
    name: "noop",
  }
}
