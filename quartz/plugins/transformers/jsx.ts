import { readFileSync, readdirSync } from "fs"
import type { Parents, Text, Element, Root } from "hast"
import { fromHtml } from "hast-util-from-html"
import { h } from "hastscript"
import yml from "js-yaml"
import { join, resolve } from "path"
import { PluggableList, unified } from "unified"
import { visit } from "unist-util-visit"
import z from "zod"
import { PortfolioProjects } from "../../components/PortfolioProjects"
import { QuartzHtmlProcessor, QuartzMdProcessor } from "../../processors/parse"
import { QuartzTransformerPlugin } from "../types"
import remarkRehype from "remark-rehype"
import remarkParse from "remark-parse"
import { ObsidianFlavoredMarkdown } from "./ofm"
import { type Options as ContactOptions, PortfolioContact } from "../../components/PortfolioContact"
import { BuildCtx } from "../../util/ctx"

const projectSchema = z.object({
  name: z.string(),
  image: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  github: z.string().url().optional(),
  url: z.string().url().optional(),
})
const projectArraySchema = z.array(projectSchema)
export type Project = z.infer<typeof projectSchema>
export type ProjectArray = z.infer<typeof projectArraySchema>

export interface Options {
  projectsPath: string
  skillsPath: string
  contact?: ContactOptions
}

export const defaultOptions: Options = {
  projectsPath: "static/projects.yml",
  skillsPath: "static/skills",
}

type FoundItem = {
  text: Text
  parent: Parents
}

enum Visitor {
  contact = "contact",
  projects = "projects",
  skills = "skills",
}
type VisitorTransform = (
  ctx: BuildCtx & { ofmPipeline: (x: string) => Promise<Root> },
  opts: Options,
) => Promise<Element[]>
type VisitorMap = {
  [x in Visitor]: VisitorTransform
}

const visitorMap: VisitorMap = {
  contact: async (_ctx, opts) => {
    return [h("div", PortfolioContact({ opts: opts.contact }))]
  },
  projects: async (ctx, opts) => {
    const ppath = resolve(
      join(ctx.cfg.configuration.contentDirectory ?? "content", opts.projectsPath),
    )
    const buf = readFileSync(ppath, { encoding: "utf8" })
    const yamlPromises = yml.loadAll(buf).map(async (doc) => {
      // TODO: Parse ofm
      const yml = projectSchema.parse(doc)
      const description = await ctx.ofmPipeline(yml.description)
      return [yml, description]
    })
    const yaml = []
    for (let [i, promise] of yamlPromises.entries()) {
      yaml[i] = await promise
    }
    const el = h("div", PortfolioProjects({ yaml: yaml as [Project, Root][] }))
    return [el]
  },
  skills: async (ctx, opts) => {
    const spath = resolve(
      join(ctx.cfg.configuration.contentDirectory ?? "content", opts.skillsPath),
    )
    const svgs = readdirSync(spath).map((filename) => {
      const text = readFileSync(join(spath, filename), { encoding: "utf8" })
      return fromHtml(`<div class="skill">${text}</div>`)
    })
    return [h("div.skills", ...svgs)]
  },
}

export const JsxPlugin: QuartzTransformerPlugin<Partial<Options>> = (
  userOpts?: Partial<Options>,
) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "portfolio",
    htmlPlugins: (ctx) => {
      const plugins: PluggableList = []
      const ofm = ObsidianFlavoredMarkdown()
      const mdProcessor: QuartzMdProcessor = unified()
        .use(remarkParse)
        .use(ofm.markdownPlugins!(ctx)) as unknown as QuartzMdProcessor
      const htmlProcessor: QuartzHtmlProcessor = unified()
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(ofm.htmlPlugins!(ctx))

      plugins.push(() => {
        return async (tree: Root, file) => {
          const ofmPipeline = async (src: string) => {
            const text = ofm.textTransform!(ctx, src)
            const mdRoot = mdProcessor.parse(text)
            const md = await mdProcessor.run(mdRoot, file)
            return await htmlProcessor.run(md)
          }
          const visited: { [x in Visitor]?: FoundItem } = {}
          visit(tree, "text", (text, _idx, parent) => {
            for (const key of Object.keys(visitorMap))
              if (text.value === `::${key}`) {
                visited[key as Visitor] = { text, parent: parent as Parents }
              }
          })
          for (const [key, value] of Object.entries(visited)) {
            value.parent.children = await visitorMap[key as Visitor]({ ...ctx, ofmPipeline }, opts)
          }
        }
      })
      return plugins
    },
  }
}
