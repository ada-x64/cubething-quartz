import chalk from "chalk"
import { QuartzEmitterPlugin } from "../types"

export interface Options {
  warn?: string
}

export const defaultOptions: Options = {}

export const NoopEmitter: QuartzEmitterPlugin<Partial<Options>> = (opts?: Options) => {
  if (opts?.warn) {
    console.warn(chalk.yellow("Warning:", opts.warn))
  }
  return {
    name: "noop",
    emit: async () => {
      return []
    },
  }
}
