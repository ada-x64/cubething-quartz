import { readFileSync, readdirSync } from "fs"
import type { Element, Parents, Text } from "hast"
import { Root } from "hast"
import { fromHtml } from "hast-util-from-html"
import { h } from "hastscript"
import yml from "js-yaml"
import { join, resolve } from "path"
import { PluggableList, unified } from "unified"
import { visit } from "unist-util-visit"
import z from "zod"
import { PortfolioProjects } from "../../components/PortfolioProjects"
import {
  createHtmlProcessor,
  createMdProcessor,
  QuartzHtmlProcessor,
  QuartzMdProcessor,
} from "../../processors/parse"
import { QuartzTransformerPlugin } from "../types"
import remarkRehype from "remark-rehype"
import remarkParse from "remark-parse"
import { ObsidianFlavoredMarkdown } from "./ofm"
import { toHtml } from "hast-util-to-html"

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
}

export const defaultOptions: Options = {
  projectsPath: "static/projects.yml",
  skillsPath: "static/skills",
}

type FoundItem = {
  text: Text
  parent: Parents
}

export const PortfolioPlugin: QuartzTransformerPlugin<Partial<Options>> = (
  userOpts?: Partial<Options>,
) => {
  const { projectsPath, skillsPath } = { ...defaultOptions, ...userOpts }
  return {
    name: "portfolio",
    htmlPlugins: (ctx) => {
      const plugins: PluggableList = []
      let contentDirectory = ctx.cfg.configuration?.contentDirectory ?? "content"
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
          const visited: { projects?: FoundItem; skills?: FoundItem } = {}
          visit(tree, "text", (text, _idx, parent) => {
            if (text.value === "::projects") {
              visited.projects = { text, parent: parent as Parents }
            } else if (text.value === "::skills") {
              visited.skills = { text, parent: parent as Parents }
            }
          })
          if (visited.projects) {
            const ppath = resolve(join(contentDirectory, projectsPath))
            const buf = readFileSync(ppath, { encoding: "utf8" })
            const yamlPromises = yml.loadAll(buf).map(async (doc) => {
              // TODO: Parse ofm
              const yml = projectSchema.parse(doc)
              const description = await ofmPipeline(yml.description)
              return [yml, description]
            })
            const yaml = []
            for (let [i, promise] of yamlPromises.entries()) {
              yaml[i] = await promise
            }
            const el = h("div", PortfolioProjects({ yaml }))
            visited.projects.parent!.children = [el]
          }
          if (visited.skills) {
            const spath = resolve(join(contentDirectory, skillsPath))
            const svgs = readdirSync(spath).map((filename) => {
              const text = readFileSync(join(spath, filename), { encoding: "utf8" })
              return fromHtml(`<div class="skill">${text}</div>`)
            })
            visited.skills.parent!.children = [h("div.skills", ...svgs)]
          }
        }
      })
      return plugins
    },
  }
}
